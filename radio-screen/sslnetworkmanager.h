#include <QNetworkReply>

class SslNetworkManager : public QNetworkAccessManager
{
    Q_OBJECT
    public:
        SslNetworkManager();


    protected:
        QNetworkReply* createRequest(Operation op, const QNetworkRequest & req, QIODevice * outgoingData = 0);
};


