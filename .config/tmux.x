source-file ~/.config/tmux
new -s x
neww -n "NPM" "cd ~/programs/radio-interface-dist && node ../radio-http/server.js"
neww -n "X" "startx"
