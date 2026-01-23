local command = '$SHELL -i -c "open https://localhost:5173/ && nvm use && npm run dev"'

local build = function()
	vim.fn.system("tmux kill-window -t npm 2>/dev/null")
	vim.fn.system("tmux new-window -d -n npm '" .. command .. "'")
end

vim.keymap.set("n", "<leader>B", build, { desc = "Build & Run" })
