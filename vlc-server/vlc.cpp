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

#include "vlc.h"

libvlc_event_manager_t *player_ev_manager;
libvlc_event_manager_t *playlist_ev_manager;
libvlc_event_manager_t *media_ev_manager;

vlc::vlc(bool debug) :
    is_looping(0)
{
    char const *vlc_argv[] =
       {
        "-I http", /* Don't use any interface */
        "--http-password", "x", /* Don't use any interface */
        //"--sout-ffmpeg-rc-buffer-size 1835008", 
        "--ignore-config", /* Don't use VLC's config */
        "--no-video", /* Don't use VLC's config */
        //"--subsdec-encoding=ISO-8859-2", 
        /*"--freetype-rel-fontsize=Smaller", 
        "--freetype-color=16776960", 
        "--freetype-font=Ubuntu",*/
        debug ? "-vvv" : "",  //be much more verbose then normal for debugging purpose
        //"--extraintf=logger", //log anything
    };

    qRegisterMetaType<struct VlcStatus>();

    this->current_media = NULL;
    int vlc_argc = sizeof(vlc_argv) / sizeof(*vlc_argv);
    this->vlc_inst = libvlc_new (vlc_argc, vlc_argv);
    if (this->vlc_inst == NULL){
        exit(1);
    }

    this->playlist = libvlc_media_list_new(this->vlc_inst);
    this->player = libvlc_media_list_player_new(this->vlc_inst);
    this->vlc_player = libvlc_media_player_new(this->vlc_inst);
    libvlc_media_list_player_set_media_list(this->player, this->playlist);
    libvlc_media_list_player_set_media_player(this->player, this->vlc_player);

    media_ev_manager = NULL;
    player_ev_manager = libvlc_media_player_event_manager(this->vlc_player);
    playlist_ev_manager = libvlc_media_list_player_event_manager(this->player);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerPlaying, event_man, this);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerTimeChanged, event_man, this);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerPaused, event_man, this);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerMediaChanged, event_man, this);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerTimeChanged, event_man, this);
    libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerEndReached, event_man, this);
    // libvlc_event_attach(playlist_ev_manager, libvlc_MediaListPlayerStopped, event_man, this);
    // libvlc_event_attach(player_ev_manager, libvlc_MediaPlayerStopped, event_man, this);
}

void vlc::event_man(const struct libvlc_event_t  * event, void *data){
    vlc *self=reinterpret_cast<vlc*>(data);
    self->process_events(libvlc_event_type_name (event->type));
}

void vlc::process_events(const char *_name){
    QString name(_name);
    if (name.compare("MediaPlayerTimeChanged") != 0){
        this->build_playlist();
    }
    emit VlcEvent(name, this->get_status());
    if (name.compare("MediaPlayerTimeChanged") != 0){
        qDebug() << "EVENT IS" << _name;
    }
    // qDebug() << name;
    if (name.compare("MediaPlayerStopped") == 0){
        this->now_playing = "";
    }
    if (name.compare("MediaPlayerTimeChanged") == 0){
        if (QString(libvlc_media_get_meta(current_media, libvlc_meta_NowPlaying)).compare(this->now_playing) != 0){
            this->process_events("MediaMetaChanged");
            this->now_playing = libvlc_media_get_meta(current_media, libvlc_meta_NowPlaying);
        }
    }
    if (name.compare("MediaPlayerPlaying") == 0 || name.compare("MediaPlayerEndReached") == 0 || name.compare("MediaPlayerStopped") == 0){
        this->current_media = libvlc_media_player_get_media(this->vlc_player);
        if (this->current_media != NULL){
            this->now_playing = QString(libvlc_media_get_meta(current_media, libvlc_meta_NowPlaying));
        }
        else {
            this->now_playing = "";
        }
    }
    // if (name.compare("MediaPlayerPlaying") == 0 || name.compare("MediaPlayerEndReached") == 0 || name.compare("MediaPlayerStopped") == 0){
    //     if (media_ev_manager != NULL && current_media != NULL){
    //         libvlc_event_detach(media_ev_manager, libvlc_MediaMetaChanged, event_man, 0);
    //         media_ev_manager = NULL;
    //     }
    //     if (name.compare("MediaPlayerPlaying") == 0){
    //         this->current_media = libvlc_media_player_get_media(this->vlc_player);
    //         QString uri = QString(libvlc_media_get_mrl(current_media));
    //         qDebug() << "URI IS" << uri;
    //         if (this->current_media != NULL){
    //             media_ev_manager = libvlc_media_event_manager(current_media);
    //             libvlc_event_attach(media_ev_manager, libvlc_MediaMetaChanged, event_man, this);
    //         }
    //     }
    // }
}

vlc::~vlc(){
    this->destroy_objects();
}

void vlc::clear_not_playing()
{
    libvlc_media_t *current_media = libvlc_media_player_get_media(this->vlc_player);
    this->playlist_access.lock();
    foreach(libvlc_media_t *media, this->playlist_items){
        if (media != current_media){
            this->remove_media_from_playlist(this->playlist, media);
        }
    }
    while (libvlc_media_list_count(this->playlist) > 0){
        libvlc_media_list_remove_index(playlist, 0);
    }
    this->playlist_access.unlock();
    this->build_playlist();
}

void vlc::clear_all()
{
    this->stop();
    this->playlist_access.lock();
    foreach(libvlc_media_t *media, this->playlist_items){
        this->remove_media_from_playlist(this->playlist, media);
    }
    while (libvlc_media_list_count(this->playlist) > 0){
        libvlc_media_list_remove_index(playlist, 0);
    }
    this->playlist_access.unlock();
    this->build_playlist();
}

void vlc::open_url(QString src, int play){
    QString url;
    if (src.indexOf(QRegExp("^http")) == -1){
        url = "file://" + src.replace(" ", "%20");
    }
    else {
        url = src;
    }
    qDebug() << "URL IS" << url;
    libvlc_media_t *media = libvlc_media_new_location(this->vlc_inst, url.toStdString().c_str());
    libvlc_media_list_add_media(this->playlist, media);
    libvlc_media_release(media);

    if (play){
        this->play(libvlc_media_list_count(this->playlist) - 1);
    }
    else {
        this->build_playlist();
    }
}

int vlc::is_playlist(QString src){
    QRegExp r("\\.(asx|m3u|xspf|pls)", Qt::CaseInsensitive);
    QRegExp youtube("youtube\\.com/playlist", Qt::CaseInsensitive);
    return r.indexIn(src) != -1 || youtube.indexIn(src) != -1;
}

void vlc::play(int idx){
    if (idx == -1){
        int state = libvlc_media_list_player_get_state(this->player);
        if (state == libvlc_Paused){
            this->pause();
            return ;
        }
        if (idx == -1){
            libvlc_media_t *media = libvlc_media_player_get_media(this->vlc_player);
            if (media != NULL){
                libvlc_media_player_play(this->vlc_player);
                return ;
            }
            idx = 0;
        }
    }
    libvlc_media_list_player_play_item_at_index(this->player, idx);
    // if (libvlc_errmsg() != NULL){
    //     this->process_events((QString("error") + QString(libvlc_errmsg())).toStdString().c_str());
    //     libvlc_clearerr();
    // }
}

void vlc::pause(){
    libvlc_media_list_player_pause(this->player);
}

void vlc::loop(){
    libvlc_media_list_player_set_playback_mode(this->player, is_looping ? libvlc_playback_mode_default : libvlc_playback_mode_loop);
    this->is_looping = !this->is_looping;
    this->process_events("MediaLooping");
}

void vlc::shuffle(){
    int i;
    this->playlist_access.lock();
    libvlc_media_t *current_media = libvlc_media_player_get_media(this->vlc_player);
    QList<libvlc_media_t *> current_list;
    foreach(libvlc_media_t *media, this->playlist_items){
        if (media != current_media){
            current_list.append(media);
        }
    }

    while (current_list.size() > 0){
        i = qrand() % current_list.size();
        this->remove_media_from_playlist(this->playlist, current_list.at(i), 0);
        libvlc_media_list_add_media(this->playlist, current_list.at(i));
        current_list.removeAt(i);
    }

    this->playlist_access.unlock();

    this->build_playlist();
}

void vlc::remove_media_from_playlist(libvlc_media_list_t *playlist, libvlc_media_t *media, int release)
{
    for (int i = 0; i < libvlc_media_list_count(playlist); i++){
        libvlc_media_t *search_media = libvlc_media_list_item_at_index(playlist, i);
        if (media == search_media){
            libvlc_media_list_remove_index(playlist, i);
            if (release){
                libvlc_media_release(media);
            }
            break;
        }
        libvlc_media_list_t *subitems = libvlc_media_subitems(search_media);
        if (subitems != NULL){
            this->remove_media_from_playlist(subitems, media);
        }
    }
}

void vlc::destroy_objects(){
    /* Stop playing */

    libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerPlaying, event_man, 0);
    libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerPaused, event_man, 0);
    libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerMediaChanged, event_man, 0);
    libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerTimeChanged, event_man, 0);
    libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerEndReached, event_man, 0);
    // libvlc_event_detach(playlist_ev_manager, libvlc_MediaListPlayerStopped, event_man, 0);
    // libvlc_event_detach(player_ev_manager, libvlc_MediaPlayerStopped, event_man, 0);
    // /* Free the media_player */

    libvlc_media_list_release(this->playlist);
    libvlc_media_list_player_release (this->player);
    libvlc_media_player_release(this->vlc_player);
    libvlc_release (this->vlc_inst);
}

void vlc::stop(){
    libvlc_media_player_stop(this->vlc_player);
    this->process_events("MediaPlayerStopped");
}

void vlc::prev(){
    libvlc_media_list_player_previous(this->player);
}

void vlc::next(){
    libvlc_media_list_player_next(this->player);
}

void vlc::build_playlist(){
    this->playlist_access.lock();
    this->playlist_items.clear();
    this->_build_playlist(this->playlist);
    this->playlist_access.unlock();
}

void vlc::play_item(long id)
{
    libvlc_media_t *media = (libvlc_media_t *) id;
    libvlc_media_list_player_play_item(this->player, media);
}

void vlc::remove_item(long id)
{
    libvlc_media_t *media = (libvlc_media_t *) id;
    this->remove_media_from_playlist(this->playlist, media);
    this->build_playlist();
}

void vlc::_build_playlist(libvlc_media_list_t *playlist)
{
    for (int i = 0; i < libvlc_media_list_count(playlist); i++){
        libvlc_media_t *media = libvlc_media_list_item_at_index(playlist, i);
        QString uri = QString(libvlc_media_get_mrl(media));
        libvlc_media_list_t *subitems = libvlc_media_subitems(media);
        if (subitems != NULL){
            this->_build_playlist(subitems);
        }
        else {
            this->playlist_items.append(media);
        }
    }
}

QList<PlaylistItem> vlc::get_playlist(){
    QList<PlaylistItem> result;
    libvlc_media_t *current_media = libvlc_media_player_get_media(this->vlc_player);
    foreach(libvlc_media_t *media, this->playlist_items){
        PlaylistItem item;
        QString uri = QString(libvlc_media_get_mrl(media));
        libvlc_media_parse(media);
        item.duration = libvlc_media_get_duration(media);
        item.id = QString::number((long) media);
        item.name = QString(libvlc_media_get_meta(media, libvlc_meta_Title));
        item.uri = uri;
        item.playing = current_media == media;
        result.append(item);
    }

    return result;
}

struct VlcStatus vlc::get_status(){
    VlcStatus result;
    libvlc_media_t *media = libvlc_media_player_get_media(this->vlc_player);
    if (media == NULL){
        result.length = 0;
        result.loop = this->is_looping;
        result.position = 0;
        result.repeat = 0;
        result.state = "stopped";
        result.stream_info.now_playing = "";
    }
    else {
        libvlc_media_parse(media);
        result.length = libvlc_media_player_get_length(this->vlc_player) / 1000;
        result.loop = this->is_looping;
        if (result.length != 0){
            result.position = ((libvlc_media_player_get_time(this->vlc_player) / 1000.0) / result.length) * 1.0;
        }
        else {
            qint16 time = libvlc_media_player_get_time(this->vlc_player) / 1000;
            if (time != 0){
                result.length = time;
                result.position = 1;
            }
            else {
                result.position = 0;
            }
        }
        result.repeat = 0;
        libvlc_state_t state = libvlc_media_list_player_get_state(this->player);
        result.state = state == libvlc_Playing ? "playing" : (state == libvlc_Paused ? "paused" : "stopped");

        result.stream_info.now_playing = QString(libvlc_media_get_meta(media, libvlc_meta_NowPlaying));
        result.stream_info.artist = QString(libvlc_media_get_meta(media, libvlc_meta_Artist));
        result.stream_info.filename = QString(libvlc_media_get_mrl(media));
        result.stream_info.description = QString(libvlc_media_get_meta(media, libvlc_meta_Description));
        result.stream_info.title = QString(libvlc_media_get_meta(media, libvlc_meta_Title));
        result.stream_info.genre = QString(libvlc_media_get_meta(media, libvlc_meta_Genre));
        result.stream_info.url = QString(libvlc_media_get_meta(media, libvlc_meta_URL));
    }

    return result;
}

void vlc::seek(int time)
{
    int current_time = libvlc_media_player_get_time(this->vlc_player);
    long length = (libvlc_media_player_get_length(this->vlc_player) * 1.0) * (time / 100.0);
    qint64 x = current_time;
    qDebug() << QVariant(x).toString();
    x = length;
    qDebug() << QVariant(x).toString();
    libvlc_media_player_set_time(this->vlc_player, current_time + length);
}


void vlc::save_playlist(QString name, QString path)
{
    tpl t1(":/resources/track.tpl");
    tpl t2(":/resources/xspf.tpl");
    QMap<QString, QString> args;
    QString tracks = "";

    foreach(libvlc_media_t *media, this->playlist_items){
        args.clear();
        args["location"] = QString(libvlc_media_get_mrl(media));
        args["duration"] = QString::number(libvlc_media_get_duration(media));

        tracks += t1.parse(args);
    }

    args.clear();
    args["name"] = name;
    args["tracks"] = tracks;

    QString content = t2.parse(args);

    QFile f(path + "/" + name + ".xspf");
    f.open(QIODevice::WriteOnly | QIODevice::Text);
    f.write(content.toStdString().c_str());
    f.close();
}
