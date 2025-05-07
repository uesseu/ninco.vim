scriptencoding utf-8
" ninco.vim
" Last Change:	2023 Sep 25
" Maintainer:	Shoichiro Nakanishi <sheepwing@kyudai.jp>
" License:	Mit licence

if exists('g:loaded_ninco')
  finish
endif
let s:save_cpo = &cpo
set cpo&vim

let g:loaded_ninco = 1

if !exists('g:ninco#single')
  let g:ninco#single = 0
endif
if !exists('g:ninco#winid')
  let g:ninco#winid = -1
endif
if !exists('g:ninco#command')
  let g:ninco#command = ''
endif
if !exists('g:ninco#command_args')
  let g:ninco#command_args = []
endif
if !exists('g:ninco#max_log')
  let g:ninco#max_log = 20
endif
if !exists('g:ninco#min_log')
  let g:ninco#min_log = 10
endif
if !exists('g:ninco#_length')
  let g:ninco#_length = 0
endif
if !exists('g:ninco#async_cmd_win')
  let g:ninco#async_cmd_win = '__CHATGPT__'
endif

function! NincoNew(name)
  return #{name: a:name,
        \single: 1,
        \max_log: 20,
        \min_log: 10,
        \length: 0,
        \win: '__CHATGPT__',
        \command: '',
        \command_args: [],
        \win_id: -1
        \}
endfunction

function! NincoRun()
endfunction

function! GetVisualSelection()
  let [line_start, column_start] = getpos("'<")[1:2]
  let [line_end, column_end] = getpos("'>")[1:2]
  let lines = getline(line_start, line_end)
  if len(lines) == 0
    return ''
  endif
  let lines[-1] = lines[-1][: column_end - (&selection == 'inclusive' ? 1 : 2)]
  let lines[0] = lines[0][column_start - 1:]
  return join(lines, "\n")
endfunction


function! NincoEnableWindow(key, model='gpt-3.5-turbo',
	\url="https://api.openai.com/v1/chat/completions", vertical=0)
  call denops#request("ninco", "init", [a:key, a:model, a:url])
  let g:ninco#winid = bufwinid(g:ninco#async_cmd_win)
  let g:async_cmd_win = g:ninco#async_cmd_win
  let result_pool = []
  if g:ninco#winid == -1
    if a:vertical == 1
      execute 'vsplit '.g:ninco#async_cmd_win
    else
      execute 'split '.g:ninco#async_cmd_win
    endif
    setlocal buftype=nofile bufhidden=wipe noswapfile
    setlocal wrap nonumber signcolumn=no filetype=markdown
    call win_execute(g:ninco#winid, 'setlocal modifiable', 1)
    wincmd p
    let g:ninco#winid = bufwinid(g:ninco#async_cmd_win)
  endif
endfunction

function! NincoEnable(key, model, url="https://api.openai.com/v1/chat/completions")
  call denops#request("ninco", "init", [a:key, a:model, a:url])
  let g:ninco#winid = -1
endfunction

function! Ninco(template = "", ...)
  if g:ninco#single == 0 && g:ninco#max_log != 0
    let g:ninco#_length = g:ninco#_length + 1
  endif
  call NincoPutEnter()
  if a:template != ""
    let order = join(readfile(a:template), "\n")
    for word in a:000
      let order = printf(order, word)
    endfor
  else
    let order = join(a:000, "\n")
  endif
  if g:ninco#winid != -1
    call NinPutWindow("# ")
    for word in split(order, "\n")
  call NinPutWindow(word)
    endfor
    call NincoPutEnter()
    call NinPutWindow("--------------------")
  endif
  call NincoPutEnter()
  if g:ninco#single == 1
    call denops#request('ninco', 'single',
          \[order, g:ninco#command, g:ninco#command_args])
  else
    call denops#request('ninco', 'put',
          \[order, g:ninco#command, g:ninco#command_args])
  endif
  if g:ninco#max_log < g:ninco#_length && g:ninco#single == 0
    call NincoCompress(g:ninco#min_log)
  endif
endfunction

function! NinPutWindow(args) abort
  let args = substitute(a:args, '\\ ', ' ', 'g')
  if g:ninco#winid == -1
    let cur_line = line('.')
    call setline(cur_line, getline(cur_line) . args)
    call execute('norm $')
  else
    call win_execute(g:ninco#winid, 'norm G')
    let hist = getbufline(g:ninco#async_cmd_win, '$')
    let argstr = hist[-1] . args
    call setbufline(g:ninco#async_cmd_win, line('$', bufwinid(g:ninco#async_cmd_win)),  argstr)
    call win_execute(g:ninco#winid, 'norm $')
  endif
endfunction

function! NinPutWindowDeno(args) abort
  let args = substitute(a:args, '\\ ', ' ', 'g')
  if strlen(args) == 1
    return ''
  endif
  let args = args[:len(args) - 2]
  if g:ninco#winid == -1
    let cur_line = line('.')
    call setline(cur_line, getline(cur_line) . args)
    call execute('norm $')
  else
    call win_execute(g:ninco#winid, 'norm G')
    let hist = getbufline(g:ninco#async_cmd_win, '$')
    let argstr = hist[-1] . args
    call setbufline(g:ninco#async_cmd_win, line('$', bufwinid(g:ninco#async_cmd_win)),  argstr)
    call win_execute(g:ninco#winid, 'norm $')
  endif
endfunction

command -nargs=1 NinPutWindowDeno call NinPutWindowDeno(<f-args>)

function! NincoPutEnter()
  if g:ninco#winid == -1
    call execute('norm o')
  else
    call win_execute(g:ninco#winid, 'norm o')
  endif
endfunction

function! NincoCompress(num)
  if g:ninco#winid != -1
    call NinPutWindow("### Compress ###")
  endif
  call NincoPutEnter()
  call denops#request('ninco', 'compress', [a:num, 'Please summaryze these messages.'])
endfunction

function! NincoResetSystem(order)
  if g:ninco#winid != -1
    call NinPutWindow("### ResetSystem ###")
  endif
  call NincoPutEnter()
  call denops#request('ninco', 'resetSystem', [a:order])
endfunction

function! NincoPutSystem(order)
  if g:ninco#winid != -1
    call NinPutWindow("# " . a:order)
  endif
  call NincoPutEnter()
  call denops#request('ninco', 'putSystem', [a:order])
endfunction

function! NincoReset()
  if g:ninco#winid != -1
    call NinPutWindow("### Reset ###")
  endif
  call NincoPutEnter()
  call denops#request('ninco', 'reset', [])
endfunction


let &cpo = s:save_cpo
unlet s:save_cpo
