/*****************************************************************************
 * libvlc_mozilla_plugin.h
 *****************************************************************************
 * Authors: Cosmin Popescu <cosminadrianpopescu@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA 02110-1301, USA.
 *****************************************************************************/

#ifndef VLC_H
#define VLC_H

#include <vlc/vlc.h>
#include <QString>
#include <QFile>
#include "vlc/libvlc_events.h"
#include <stdio.h>
#include <QList>
#include <QTimer>
#include <QtCore/QDebug>
#include <QRegExp>
#include <QMutex>
#include "tpl.h"

struct PlaylistItem {
    int duration; 
    QString id, name, uri;
    bool playing;
};

struct VlcStreamInfo {
    QString artist, filename, description, title, genre, url, now_playing;
};

struct VlcStatus {
    qint64 length;
    float position;
    int repeat, loop, shuffle;
    struct VlcStreamInfo stream_info;
    QString state;
};

Q_DECLARE_METATYPE(struct VlcStatus)

class vlc : public QObject
{
    Q_OBJECT
public:
    explicit vlc(bool debug = false);
    ~vlc();
    
    void open_url(QString src, int play = 1);
    void play(int idx = -1);
    void pause();
    void stop();
    void prev();
    void next();
    void loop();
    void shuffle();
    void clear_all();
    void clear_not_playing();
    void play_item(long id);
    void remove_item(long id);
    void save_playlist(QString name, QString path);
    void seek(int time);
    struct VlcStatus get_status();
    QList<PlaylistItem> get_playlist();
    QList<libvlc_media_t *> playlist_items;
    void remove_media_from_playlist(libvlc_media_list_t *playlist, libvlc_media_t *media, int release = 1);

    void process_events(const char *name);

signals:
    void VlcEvent(QString name, VlcStatus status);
private:
    void build_playlist();
    void _build_playlist(libvlc_media_list_t *playlist);
    libvlc_media_t *current_media;
    QString now_playing;
    QMutex playlist_access;
    static void event_man(const struct libvlc_event_t  *event, void *data);
    int is_looping;
    void destroy_objects();
    libvlc_instance_t *vlc_inst;
    libvlc_media_list_t *playlist;
    libvlc_media_list_player_t *player;
    libvlc_media_player_t *vlc_player;
    int is_playlist(QString src);
};

#endif // VLC_H
