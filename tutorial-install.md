1. Burn the image to disk

```
cd /tmp
wget http://popestii.eu/cloud/index.php/s/QyjsvvGQSuXYfxu/download
sudo dd if=radio.img of=/dev/mmcblk0
```

* there are two partitions; resize the last partition:
    * Run `fdisk`. It will prompt you for a command. Enter `p`. It will 
      show the start sectors for each partition. Note down the start
      sector of the last partition. Then delete this partition (command: `d`)
      and create a new one with the start sector you noted down before
      with the maximum space available

```
$ sudo fdisk /dev/mmcblk0

Welcome to fdisk (util-linux 2.29.2).
Changes will remain in memory only, until you decide to write them.
Be careful before using the write command.


Command (m for help): p
Disk /dev/mmcblk0: 3.7 GiB, 3965190144 bytes, 7744512 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x9a23a715

Device         Boot Start     End Sectors  Size Id Type
/dev/mmcblk0p1       8192   92159   83968   41M  c W95 FAT32 (LBA)
/dev/mmcblk0p2      92160 4802559 4710400  2.3G 83 Linux

Command (m for help): d
Partition number (1,2, default 2):

Partition 2 has been deleted.

Command (m for help): n
Partition type
   p   primary (1 primary, 0 extended, 3 free)
   e   extended (container for logical partitions)
Select (default p):

Using default response p.
Partition number (2-4, default 2):
First sector (2048-7744511, default 2048): 92160
Last sector, +sectors or +size{K,M,G,T,P} (92160-7744511, default 7744511):

Created a new partition 2 of type 'Linux' and of size 3.7 GiB.
Partition #2 contains a ext4 signature.

Do you want to remove the signature? [Y]es/[N]o: N

Command (m for help): w
$ sudo e2fsck -f /dev/mmcblk0p2
$ sudo resize2fs /dev/mmcblk0p2
```

2. Customize the installation

* `sudo mount /dev/mmcblk0p2 /mnt`
* edit the `/mnt/home/pi/programs/radio-interface-dist/main.bundle.js`
  file and change: 

    * `<your-user-channel-id>` with your youtube channel user (get it from
      [here](https://support.google.com/youtube/answer/3250431?hl=en))
    * `<your-youtube-api-key>` with your youtube API key (get it from
      [here](https://developers.google.com/youtube/v3/getting-started))
    * `<your-town>` with your own town (weather will show for this town; check it on
      openweathermap.org)
    * `<your-openweather-api-key>` with your own openweather key (get it from
      [here](http://openweathermap.org/appid))

3. Set the network

* edit `/mnt/etc/wpa_supplicant/wpa_supplicant.conf` file (see
  [here](https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md))

4. Set the timezone

* `sudo cp /usr/share/zoneinfo/<continent>/<country> /etc/localtime` 

*NOTE*: The radio has the possibility to cache the youtube videos using
[`youtube-dl`](https://github.com/rg3/youtube-dl/). The pre-build system comes
without `youtube downloader`. If you want this, you can install it in
`/home/pi/programs` folder (see the [build
guide](https://github.com/cosminadrianpopescu/internet-radio/blob/master/tutorial-build.md)).
If you install it, then you have to be carefull with the space on the sd card.
