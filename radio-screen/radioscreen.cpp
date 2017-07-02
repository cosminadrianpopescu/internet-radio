#include "radioscreen.h"
#include "ui_radioscreen.h"

RadioScreen::RadioScreen(QWidget *parent, qint16 w, qint16 h, QString url, qint16 debug) :
    QMainWindow(parent),
    ui(new Ui::RadioScreen)
{
    ui->setupUi(this);

    QSslConfiguration sslCfg = QSslConfiguration::defaultConfiguration();
    QList<QSslCertificate> ca_list = sslCfg.caCertificates();
    QList<QSslCertificate> ca_new = QSslCertificate::fromData("CaCertificates");
    ca_list += ca_new;

    sslCfg.setCaCertificates(ca_list);
    sslCfg.setProtocol(QSsl::AnyProtocol);
    QSslConfiguration::setDefaultConfiguration(sslCfg);

    this->ui->mainToolBar->hide();
    this->ui->menuBar->hide();
    this->ui->statusBar->hide();
    this->setFixedSize(w, h);
    this->ui->webView->settings()->enablePersistentStorage("/home/pi/.cache/radio-screen/");
    this->ui->webView->settings()->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    // this->ui->webView->setFixedSize(w, h);
    this->ui->webView->load(QUrl(url));
    this->showFullScreen();
    connect(this->ui->webView->page()->networkAccessManager(),
            SIGNAL(sslErrors(QNetworkReply*, const QList<QSslError> & )),
            this,
            SLOT(sslErrorHandler(QNetworkReply*, const QList<QSslError> & )));    
    // connect(this->ui->webView->page(), 
    //         SIGNAL(frameCreated(QWebFrame *)), 
    //         this, 
    //         SLOT(onFrameCreated(QWebFrame *)));
    // page->setNetworkAccessManager(new QNetworkAccessManager());
    if (debug){
        QWebPage *page = this->ui->webView->page();
        QWebInspector *inspector = new QWebInspector();
        inspector->setPage(page);
        inspector->show();
    }
}

void RadioScreen::sslErrorHandler(QNetworkReply* qnr, const QList<QSslError> & errlist)
{
  // show list of all ssl errors
    printf("SSL Error\n");
  foreach (QSslError err, errlist){
      QByteArray b = err.errorString().toLatin1();
      const char *s = b.data();
    printf("%s\n", s);
  }

  qnr->ignoreSslErrors();
}

void RadioScreen::onFrameCreated(QWebFrame *frame)
{
    this->youtubeFrame = frame;
    connect(frame, SIGNAL(loadFinished(bool)), this, SLOT(onLoadFinished(bool)));
}

void RadioScreen::onLoadFinished(bool ok)
{
    printf("LOAD FINISHED %s\n", this->youtubeFrame->toHtml().toStdString().c_str());
}

RadioScreen::~RadioScreen()
{
    delete ui;
}
