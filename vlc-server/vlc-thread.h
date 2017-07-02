/****************************************************************************
**
** Copyright (C) 2014 Kurt Pattyn <pattyn.kurt@gmail.com>.
** Contact: http://www.qt.io/licensing/
**
** This file is part of the QtWebSockets module of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:LGPL21$
** Commercial License Usage
** Licensees holding valid commercial Qt licenses may use this file in
** accordance with the commercial license agreement provided with the
** Software or, alternatively, in accordance with the terms contained in
** a written agreement between you and The Qt Company. For licensing terms
** and conditions see http://www.qt.io/terms-conditions. For further
** information use the contact form at http://www.qt.io/contact-us.
**
** GNU Lesser General Public License Usage
** Alternatively, this file may be used under the terms of the GNU Lesser
** General Public License version 2.1 or version 3 as published by the Free
** Software Foundation and appearing in the file LICENSE.LGPLv21 and
** LICENSE.LGPLv3 included in the packaging of this file. Please review the
** following information to ensure the GNU Lesser General Public License
** requirements will be met: https://www.gnu.org/licenses/lgpl.html and
** http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html.
**
** As a special exception, The Qt Company gives you certain additional
** rights. These rights are described in The Qt Company LGPL Exception
** version 1.1, included in the file LGPL_EXCEPTION.txt in this package.
**
** $QT_END_LICENSE$
**
****************************************************************************/
#ifndef VLC_THREAD
#define VLC_THREAD

#include <QJsonObject>
#include <QJsonDocument>
#include <QJsonArray>
#include "QtWebSockets/qwebsocket.h"
#include <QThread>
#include <QDirIterator>
#include <QProcess>
#include "vlc.h"

#define OPEN_URL "openUrl"
#define STOP "stop"
#define GET_YOUTUBE_URL "get_youtube_url"
#define GET_METADATA "get_metadata"
#define IS_CACHED "is_cached"
#define CACHE "cache"
#define LOG "log"
#define PLAY "play"
#define PREV "prev"
#define NEXT "next"
#define PAUSE "pause"
#define SEEK_BACK "seek_back"
#define SEEK_FORWARD "seek_forward"
#define SHUFFLE "shuffle"
#define LOOP "loop"
#define GET_STATUS "get_status"
#define GET_PLAYLIST "get_playlist"
#define BROWSE_FILES "browse_files" //
#define CLEAR_ALL "clearAll"
#define PLAY_ITEM "playItem"
#define REMOVE_ITEM "removeItem"
#define ENQUE "enque"
#define SAVE_AS_PLAYLIST "saveAsPlaylist"
#define SAVE_FILE "save_file" //
#define READ_FILE "read_file" //
#define SHUTDOWN "shutdown"
#define REBOOT "reboot"

class VlcThread : public QThread
{
    Q_OBJECT
public:
    explicit VlcThread();
    ~VlcThread();
    void processTextMessage(QString message, QWebSocket *pClient);
    static QJsonObject processStatus(struct VlcStatus status);
    void run();

private Q_SLOTS:
    void processVlcEvent(QString name, VlcStatus status);
    QJsonArray get_files(QString path);

signals:
    void VlcEvent(QString name, VlcStatus status);
private:
    vlc *player;
    void save_file(QString name, QString path, QString content);
    QString read_file(QString file);
    void get_youtube_url(QString url);
    void cache(QString url);
    QJsonObject is_cached(QString url);
    QJsonArray get_playlist();
};

#endif //VLC_THREAD

