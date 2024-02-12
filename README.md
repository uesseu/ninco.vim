# What is this?
ChatGPT compatible client for vim and neovim written in typescript by denops.

It is still under developping and destructive change may be done.
It is just for my daily life, work and hobby.

# Features of ninco.vim
Good and bad point of ninco.vim is simplicity and cheapness.
However, I use it in daily life and it is useful for me. It can...

- Ask a simple question
- Ask a question of selected lines
- Talk with chatgpt, compressing old data
- Not only chatgpt of openai but also compatible servers
- Ask using templates

![](sample.gif)

# Requirements
Vim or neovim, Denops and API key of openai is also needed.
About library, it depends only on denops and so please see the requirements of denops.

# Ninco function
At first, make template. Now, I make text file named 'temlpalte.md'.

```markdown
Hello %s!
```
%s is variable. Of cource, multiple variables can be used.
Then...

```vim
:call Ninco("template.md", "world")
```

This code sends openai 'Hello world!' and prints reply.
If the first argument is blank string, no templates will be used and
just second argument will be sent to openai.

However, you must write vimrc to use it. ;-(
Please read below.
# Sample of vimrc
If you want to use this plugin, at least, you should configure vimrc.

If global variable named 'g:ninco#single_mode' is 0, log will be made and chatgpt looks remebmers your words.
```vim
let g:ninco#single_mode = 1
```

And then, you should call function to enable ninco.
```vim
call NincoEnable([API_KEY],
    \'gpt-3.5-turbo',
    \"https://api.openai.com/v1/chat/completions")
```

If you want to make new window, you can call this function.
```vim
call NincoEnableWindow([API_KEY],
    \'gpt-3.5-turbo',
    \"https://api.openai.com/v1/chat/completions"
    \0)
```
If last argument is 0, window is divided horizontally. If it is 1, vertical one is used.
The functions has default argument and if you do not want to configure,
only API_KEY is needed.


If you want to change the name of window, you can set this global variable.
```vim
let g:ninco#async_cmd_win = '__CHATGPT__'
```

Then, you can call Ninco function.

```vim
:call Ninco("", "hello!")
```

Is it so complex?
# My vimrc example
This is part of my vimrc.

This codes enables...
- Start Ninco by '\\c' or '\\d'
- Compress talklog by 'gc'
- Use Ninco by 'gn'

```
let g:ninco#single_mode = 1
let g:api_key = "[API_KEY]"
let g:ninco#gpt_model = "gpt-3.5-turbo"
let g:ninco#gpt_url = "https://api.openai.com/v1/chat/completions"

nnoremap <leader>d :call NincoEnableWindow(g:api_key, g:ninco#gpt_model, g:ninco#gpt_url)<CR>
nnoremap <leader>c :call NincoEnable(g:api_key, g:ninco#gpt_model, g:ninco#gpt_url)<CR>

" Compress log
nnoremap gc :call NincoCompress(5)

" Normal mode
nnoremap gn :call Ninco("", "")<C-F>04f"<C-C>

" Visual mode
vnoremap gn :<C-E><C-U>call Ninco("", "", GetVisualSelection())<C-F>04f"<C-C>
```

# Openai compatible local server
If you want to use openai compatible server on localhost,
you need not use api_key and model. Just use blank string.
And you should set url.
```
let g:api_key = "[API_KEY]"
let g:ninco#gpt_model = "gpt-3.5-turbo"
let g:ninco#gpt_url = "http://127.0.0.1:8000/v1/chat/completions"
call NincoEnable(g:api_key, g:ninco#gpt_model, g:ninco#gpt_url)
```

You can make compatible server by text-generation-webui.
[https://github.com/oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)
Using this, you can use it in offline environment easily.

# Model setting
If you want to change model after enabling ninco, NincoSetModel may be useful.
It may be only for openai.

```vim
call NincoSetModel('gpt-3.5-turbo')
```

[legacy note](legacy_note.md)

# Known issue
It fails to display json.
Perhaps, text processing is not adequate.

# Trouble shooting
## It never runs!
Ninco depends on denops and denops depends on vim/neovim and deno.
They are sensitive about version. If you did not upgrade, it may be a solution.

## I cannot upgrade vim!
Why do not you compile vim from source code?
It may be a simple way for a geek. ;-)

# License
MIT.
