#include "sslnetworkmanager.h"
SslNetworkManager::SslNetworkManager() :
    QNetworkAccessManager()
{
}



QNetworkReply* SslNetworkManager::createRequest(Operation op, const QNetworkRequest& req, QIODevice* outgoingData)
{
    QNetworkReply* reply = QNetworkAccessManager::createRequest(op, req, outgoingData);
    reply->ignoreSslErrors();
    return reply;
}

