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
#include "vlc-thread.h"

VlcThread::VlcThread()
{
    this->player = new vlc();
    connect(player, &vlc::VlcEvent, this, &VlcThread::processVlcEvent);
}

VlcThread::~VlcThread()
{
    delete this->player;
}

QJsonObject VlcThread::processStatus(struct VlcStatus status)
{
    QJsonObject result;
    result["length"] = status.length;
    result["loop"] = status.loop;
    result["position"] = status.position;
    result["repeat"] = status.repeat;
    result["state"] = status.state;
    QJsonObject jsonStreamInfo;
    jsonStreamInfo["now_playing"] = status.stream_info.now_playing;
    jsonStreamInfo["artist"] = status.stream_info.artist;
    jsonStreamInfo["filename"] = status.stream_info.filename;
    jsonStreamInfo["description"] = status.stream_info.description;
    jsonStreamInfo["title"] = status.stream_info.title;
    jsonStreamInfo["genre"] = status.stream_info.genre;
    jsonStreamInfo["url"] = status.stream_info.url;
    result["streamInfo"] = jsonStreamInfo;

    return result;
}

void VlcThread::processVlcEvent(QString name, VlcStatus status)
{
    emit this->VlcEvent(name, status);
}

void VlcThread::processTextMessage(QString message, QWebSocket *pClient)
{
    QJsonObject source = QJsonDocument::fromJson(message.toUtf8()).object();
    QString command = source["command"].toString();
    qDebug() << "COMMAND IS" << command;
    QJsonObject rootResult;
    if (command.compare(OPEN_URL) == 0){
        QString url = source["args"].toObject()["url"].toString();
        this->player->open_url(url);
    }
    else if (command.compare(STOP) == 0){
        this->player->stop();
    }
    else if (command.compare(PLAY) == 0){
        this->player->play();
    }
    else if (command.compare(PREV) == 0){
        this->player->prev();
    }
    else if (command.compare(NEXT) == 0){
        this->player->next();
    }
    else if (command.compare(PAUSE) == 0){
        this->player->pause();
    }
    else if (command.compare(LOOP) == 0){
        this->player->loop();
    }
    else if (command.compare(SHUFFLE) == 0){
        this->player->shuffle();
        rootResult["data"] = "ok";
    }
    else if (command.compare(GET_STATUS) == 0){
        rootResult["data"] = VlcThread::processStatus(this->player->get_status());
    }
    else if (command.compare(GET_PLAYLIST) == 0){
        rootResult["data"] = this->get_playlist();
    }
    else if (command.compare(BROWSE_FILES) == 0){
        QString path = source["args"].toObject()["path"].toString();
        rootResult["data"] = this->get_files(path);
    }
    else if (command.compare(GET_YOUTUBE_URL) == 0){
        QString url = source["args"].toObject()["url"].toString();
        this->get_youtube_url(url);
    }
    else if (command.compare(IS_CACHED) == 0){
        QString url = source["args"].toObject()["url"].toString();
        rootResult["data"] = this->is_cached(url);
    }
    else if (command.compare(CACHE) == 0){
        QString url = source["args"].toObject()["url"].toString();
        this->cache(url);
    }
    else if (command.compare(LOG) == 0){
        QString msg = source["args"].toObject()["msg"].toString();
        QFile f("/tmp/radio-interface.log");
        f.open(QFile::Append | QFile::Text);
        f.write(msg.toStdString().c_str());
        f.write("\n");
        f.close();
    }
    else if (command.compare(CLEAR_ALL) == 0){
        this->player->clear_all();
    }
    else if (command.compare(PLAY_ITEM) == 0){
        QString _id = source["args"].toObject()["id"].toString();
        qint64 id = _id.toLongLong();
        this->player->play_item(id);
    }
    else if (command.compare(REMOVE_ITEM) == 0){
        QString _id = source["args"].toObject()["id"].toString();
        qint64 id = _id.toLongLong();
        this->player->remove_item(id);
    }
    else if (command.compare(ENQUE) == 0){
        QString url = source["args"].toObject()["url"].toString();
        this->player->open_url(url, 0);
    }
    else if (command.compare(GET_METADATA) == 0){
        this->player->clear_all();
        QString url = source["args"].toObject()["url"].toString();
        this->player->open_url(url, 0);
        rootResult["data"] = this->get_playlist();
        this->player->clear_all();
    }
    else if (command.compare(SEEK_BACK) == 0 || command.compare(SEEK_FORWARD) == 0){
        qint16 time = source["args"].toObject()["time"].toInt();
        this->player->seek(time);
    }
    else if (command.compare(SAVE_AS_PLAYLIST) == 0){
        QString name = source["args"].toObject()["name"].toString();
        QString path = source["args"].toObject()["path"].toString();
        this->player->save_playlist(name, path);
        rootResult["data"] = "Ok";
    }
    else if (command.compare(SAVE_FILE) == 0){
        QString name = source["args"].toObject()["name"].toString();
        QString path = source["args"].toObject()["path"].toString();
        QString content = source["args"].toObject()["content"].toString();
        this->save_file(name, path, content);
        rootResult["data"] = "Ok";
    }
    else if (command.compare(READ_FILE) == 0){
        QString file = source["args"].toObject()["file"].toString();
        rootResult["data"] = this->read_file(file);
    }
    else if (command.compare(SHUTDOWN) == 0 || command.compare(REBOOT) == 0){
        QProcess process;
        qDebug() << "sudo " + command + " now";
        process.start("sudo " + command + " now");
        // process.start("ls -al");
        process.waitForFinished();
    }

    if (pClient && !rootResult.isEmpty()) {
        QString callback_id = source["callback_id"].toString();
        qDebug() << "CALLBACK ID is" << callback_id;
        qDebug() << "CALLBACK ID is" << source["callback_id"].toString();
        if (callback_id.compare("") != 0){
            rootResult["callback_id"] = callback_id;
        }
        QJsonDocument destination = QJsonDocument(rootResult);
        QString msg = QString(destination.toJson(QJsonDocument::Compact));
        pClient->sendTextMessage(msg);
    }
}

void VlcThread::save_file(QString name, QString path, QString content)
{
    QFile f(path + "/" + name);
    f.open(QIODevice::WriteOnly | QIODevice::Text);
    f.write(content.toStdString().c_str());
    f.close();
}

QJsonArray VlcThread::get_playlist(){
    QList<PlaylistItem> playlist = this->player->get_playlist();
    QJsonArray result;
    foreach(PlaylistItem item, playlist){
        QJsonObject jsonItem;
        jsonItem["id"] = item.id;
        jsonItem["playing"] = item.playing;
        jsonItem["duration"] = item.duration;
        jsonItem["name"] = item.name;
        jsonItem["uri"] = item.uri;

        result.append(jsonItem);
    }

    return result;
}

QString VlcThread::read_file(QString file)
{
    QFile f(file.replace(QRegExp("^file://"), ""));
    f.open(QIODevice::ReadOnly | QIODevice::Text);
    QString result(f.readAll());
    f.close();
    return result;
}

void VlcThread::cache(QString url)
{
    QProcess proc;
    QString base = "/home/pi/Music/youtube/" + url;
    QFile::remove(base);
    QFile::remove(base + "-err");
    QStringList params;
    params << url;
    proc.startDetached("/home/pi/programs/radio-interface/youtube-dl/streamer", params);
}

void VlcThread::get_youtube_url(QString url)
{
    QString base = "/home/pi/Music/youtube/" + url;
    if (QFile::exists(base + "-ok")){
        this->player->open_url(base, 1);
        return ;
    }
    this->cache(url);
    while (!QFile::exists(base)){
        QThread::msleep(100);
    }
    qDebug() << "Got movie";
    QFile file(base);
    qint64 err = 0;
    int timeout = 0;
    while (file.size() <= 100000 && !err){
        QThread::msleep(100);
        if (QFile::exists(base + "-err")){
            err = 1;
        }
        timeout += 100;
        if (timeout >= 15000){
            QFile f(base + "-err");
            f.open(QIODevice::WriteOnly | QFile::Text);
            f.write("Timeout trying to download");
            f.close();
        }
    }
    file.close();
    if (err){
        QString err;
        QFile f(base + "-err");
        f.open(QIODevice::ReadOnly);
        err = QString(f.readAll());
        f.close();
        emit this->VlcEvent("error" + err, this->player->get_status());
    }
    else {
        this->player->open_url(base, 1);
    }
    qDebug() << "Process finished";
}

QJsonObject VlcThread::is_cached(QString url)
{
    QString base = "/home/pi/Music/youtube/" + url;
    QJsonObject result;
    result["url"] = url;
    result["answer"] = QFile::exists(base + "-ok") ? "yes" : "no";

    return result;
}

QJsonArray VlcThread::get_files(QString path)
{
    QJsonArray result;
    QDirIterator it(path, QDirIterator::NoIteratorFlags);
    while (it.hasNext()){
        QString path = it.next();
        if (it.fileName().compare(".") != 0){
            QJsonObject item;
            QFileInfo info = it.fileInfo();
            item["path"] = info.absoluteFilePath();
            item["type"] = info.isDir() ? "dir" : "file";
            item["name"] = it.fileName();

            result.append(item);
        }
    }

    return result;
}

void VlcThread::run()
{
    qDebug() << "Thread started";
}
