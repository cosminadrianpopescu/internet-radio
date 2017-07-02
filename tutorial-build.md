* install raspbian-lite
* set your wireless network (edit `/etc/wpa_supplicant/wpa_supplicant.conf`)
* boot the system and log in to it
* update the system:
```
sudo -i
apt-get update
apt-get upgrade
reboot
```
* install the tontec screen driver from [here](https://github.com/notro/tinydrm/wiki/board:-Raspberry-Pi)
(or you can follow the instructions for your own touch screen)
```
sudo -i
apt-get install rpi-update
REPO_URI=https://github.com/notro/rpi-firmware BRANCH=tinydrm rpi-update
```
* configure the new screen: edit /boot/config.txt
* add the lines:
```
dtparam=spi=on
dtoverlay=mz61581
```
* reboot
* install packages:
```
sudo -i
apt-get install mplayer tmux xorg xserver-xorg-legacy xinit matchbox chromium-browser
```
* edit `/etc/X11/Xwrapper.config`
```
allowed_users=anybody
needs_root_rights=yes
```
* edit `/usr/share/X11/xorg.conf.d/99-fbturbo.conf`
* change `fb0` with `fb1`
* install nodejs:
```
mkdir programs
cd programs
wget https://nodejs.org/dist/v<ver>/node-v<ver>-linux-armv7l.tar.xz
tar -xvf node-v<ver>-linux-armv7l.tar.xz
mv node-v<ver>-linux-armv7l nodejs
rm node-v<ver>-linux-armv7l.tar.xz
export PATH=$PATH:/home/pi/programs/nodejs/bin
```

Install the radio interface:
============================

* download the last release of the radio-interface
* as `pi` user:
```
cd /tmp
git clone https://github.com/cosminadrianpopescu/internet-radio
cd 
cd programs
mv /tmp/internet-radio/radio-interface-dist .
mv /tmp/internet-radio/radio-http .
cd radio-http
npm install
cd ..
mv /tmp/internet-radio/start-screen-test .
mv /tmp/internet-radio/.xinitrc ~
```

* set the `alsamixer` volume: `alsamixer`

* create the cache directory: `mkdir -p ~/Music/youtube`
* get the `.bashrc` file: `mv /tmp/internet-radio/.bashrc ~`
* get the tmux config files: `mv /tmp/internet-radio/.config/tmux* ~/.config`
* If you want, you can install also youtube downloader:

```
curl -L https://yt-dl.org/downloads/latest/youtube-dl -o youtube-dl
chmod +x youtube-dl
```

* set the timezone: 
  `sudo cp /usr/share/zoneinfo/<continent>/<country> /etc/localtime`
* auto login as pi: edit `/etc/systemd/system/getty.target.wants/getty@tty1.service`
  and change `ExecStart=-/sbin/agetty --noclear %I $TERM` line with 
  `ExecStart=-/sbin/agetty -a pi %I $TERM`
* `sudo reboot`
