scriptencoding utf-8
" ninco.vim
" Last Change:	2023 Sep 25
" Maintainer:	Shoichiro Nakanishi <sheepwing@kyudai.jp>
" License:	Mit licence

if exists('g:loaded_ninco')
  finish
endif
let g:loaded_ninco = 1
let g:ninco#winid = -1

let s:save_cpo = &cpo
set cpo&vim

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

function! NincoEnableWindow(key, model, vertical=0)
  call denops#request("ninco.vim", "init", [a:key, a:model])
  let g:ninco#winid = bufwinid(g:async_cmd_win)
  let result_pool = []
  if g:ninco#winid == -1
    if a:vertical == 1
      execute 'vsplit '.g:async_cmd_win
    else
      execute 'split '.g:async_cmd_win
    endif
    setlocal buftype=nofile bufhidden=wipe noswapfile
    setlocal wrap nonumber signcolumn=no filetype=markdown
    call win_execute(g:ninco#winid, 'setlocal modifiable', 1)
    wincmd p
    let g:ninco#winid = bufwinid(g:async_cmd_win)
  endif
endfunction

function! NincoEnable(key, model)
  call denops#request("ninco.vim", "init", [a:key, a:model])
  let g:ninco#winid = -1
endfunction

function! NinPutWindow(args) abort
  if g:ninco#winid == -1
    let hist = getline('$')
    let s:argstr = hist . a:args
    call setline('$', s:argstr)
    call execute('norm $')
  else
    let hist = getbufline(g:async_cmd_win, '$')
    let s:argstr = hist[-1] . a:args
    call setbufline(g:async_cmd_win, '$',  s:argstr)
    call win_execute(g:ninco#winid, 'norm $')
  endif
endfunction

function! NincoEnableFunctions()
  function! NincoPutEnter()
    if g:ninco#winid == -1
      call execute('norm o')
    else
      call win_execute(g:ninco#winid, 'norm o')
    endif
  endfunction

  function! NincoSingle(order)
    if g:ninco#winid != -1
      call NinPutWindow("# " . a:order)
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'single', [a:order])
  endfunction

  function! NincoSingleVisual(order)
    if g:ninco#winid != -1
      call NinPutWindow("# " . a:order)
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'single', [a:order . "\n" . GetVisualSelection()])
  endfunction

  function! NincoPut(order)
    if g:ninco#winid != -1
      call NinPutWindow("# " . a:order)
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'put', [a:order])
  endfunction

  function! NincoPutVisual(order)
    if g:ninco#winid != -1
      call NinPutWindow("# " . a:order)
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'put', [a:order . "\n" . GetVisualSelection()])
  endfunction

  function! NincoResetSystem(order)
    if g:ninco#winid != -1
      call NinPutWindow("### ResetSystem ###")
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'resetSystem', [a:order])
  endfunction

  function! NincoPutSystem(order)
    if g:ninco#winid != -1
      call NinPutWindow("# " . a:order)
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'putSystem', [a:order])
  endfunction

  function! NincoReset()
    if g:ninco#winid != -1
      call NinPutWindow("### Reset ###")
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'reset')
  endfunction

  function! NincoCompress(num)
    if g:ninco#winid != -1
      call NinPutWindow("### Compress ###")
    endif
    call NincoPutEnter()
    call denops#request('ninco.vim', 'compress', [a:num, 'Please summaryze these messages.'])
  endfunction

  function! NincoSetModel(model)
    call denops#request('ninco.vim', 'setModel', [a:model])
  endfunction
endfunction

let &cpo = s:save_cpo
unlet s:save_cpo
