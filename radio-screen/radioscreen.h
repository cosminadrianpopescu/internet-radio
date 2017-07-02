#ifndef RADIOSCREEN_H
#define RADIOSCREEN_H

#include <QMainWindow>
#include <QWebInspector>
#include <QNetworkReply>
#include <QSslConfiguration>
#include <QWebFrame>

#define DEF_W 320
#define DEF_H 240
#define DEF_URL "http://localhost:8080/mobile-1.5.html"
namespace Ui {
class RadioScreen;
}

class RadioScreen : public QMainWindow
{
    Q_OBJECT
    
public:
    explicit RadioScreen(QWidget *parent = 0, qint16 w = DEF_W, qint16 h = DEF_H, QString url = DEF_URL, qint16 debug = 0);
    ~RadioScreen();
public slots:
    void sslErrorHandler(QNetworkReply* qnr, const QList<QSslError> & errlist);
    void onFrameCreated(QWebFrame *frame);
    void onLoadFinished(bool ok);

private:
    Ui::RadioScreen *ui;
    QWebFrame *youtubeFrame;
};

#endif // RADIOSCREEN_H
