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
#include "vlc-server.h"

QT_USE_NAMESPACE

VlcServer::VlcServer(quint16 port, bool debug, QObject *parent) :
    QObject(parent),
    m_pWebSocketServer(new QWebSocketServer(QStringLiteral("Echo Server"),
                                            QWebSocketServer::NonSecureMode, this)),
    m_clients(),
    m_debug(debug)
{
    if (m_pWebSocketServer->listen(QHostAddress::Any, port)) {
        if (m_debug)
            qDebug() << "VlcServer listening on port" << port;
        connect(m_pWebSocketServer, &QWebSocketServer::newConnection,
                this, &VlcServer::onNewConnection);
        connect(m_pWebSocketServer, &QWebSocketServer::closed, this, &VlcServer::closed);
        connect(&this->vlcThread, &VlcThread::VlcEvent, this, &VlcServer::processVlcEvent);
    }
}

VlcServer::~VlcServer()
{
    m_pWebSocketServer->close();
    qDeleteAll(m_clients.begin(), m_clients.end());
}

void VlcServer::processVlcEvent(QString name, VlcStatus status)
{
    QJsonObject root;

    // qDebug() << "GOT EVENT" << name;

    if (name.compare("MediaPlayerPlaying") == 0 || name.compare("MediaPlayerPaused") == 0 
            || name.compare("MediaPlayerStopped") == 0 || name.compare("MediaPlayerEndReached") == 0){
        name = "state";
    }
    else if (name.compare("MediaPlayerMediaChanged") == 0 || name.compare("MediaMetaChanged") == 0
            || name.compare("MediaPlayerTitleChanged") == 0){
        name = "streamInfo";
    }
    else if (name.compare("MediaPlayerTimeChanged") == 0){
        name = "position";
    }
    root["status"] = VlcThread::processStatus(status);
    root["event"] = name;

    QString msg = QString(QJsonDocument(root).toJson(QJsonDocument::Compact));
    // qDebug() << "SEND MESSAGE" << msg;
    foreach(QWebSocket *client, m_clients){
        client->sendTextMessage(msg);
    }
}

void VlcServer::onNewConnection()
{
    QWebSocket *pSocket = m_pWebSocketServer->nextPendingConnection();

    connect(pSocket, &QWebSocket::textMessageReceived, this, &VlcServer::processTextMessage);
    connect(pSocket, &QWebSocket::binaryMessageReceived, this, &VlcServer::processBinaryMessage);
    connect(pSocket, &QWebSocket::disconnected, this, &VlcServer::socketDisconnected);

    m_clients << pSocket;
}

void VlcServer::processTextMessage(QString message)
{
    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
    if (m_debug){
        qDebug() << "Message received:" << message;
    }

    vlcThread.processTextMessage(message, pClient);
}

void VlcServer::processBinaryMessage(QByteArray message)
{
    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
    if (m_debug)
        qDebug() << "Binary Message received:" << message;
    if (pClient) {
        pClient->sendBinaryMessage(message);
    }
}

void VlcServer::socketDisconnected()
{
    QWebSocket *pClient = qobject_cast<QWebSocket *>(sender());
    if (m_debug)
        qDebug() << "socketDisconnected:" << pClient;
    if (pClient) {
        m_clients.removeAll(pClient);
        pClient->deleteLater();
    }
}
