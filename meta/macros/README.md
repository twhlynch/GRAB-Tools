Useful vim macros. Load the current file into register `q` with:
```vim
:lua vim.fn.setreg('q', table.concat(vim.fn.readfile(vim.fn.expand('%'), 'b'), '\n'))
```
