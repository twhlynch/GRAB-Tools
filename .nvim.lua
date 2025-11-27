vim.keymap.set("n", "<leader>B", function()
	local command = "open https://localhost:5173/ && npm run dev"
	vim.fn.system("tmux kill-window -t npm 2>/dev/null")
	vim.fn.system("tmux new-window -d -n npm '" .. command .. "'")
end, { desc = "Build & Run" })
