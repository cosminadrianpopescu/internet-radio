#include "radioscreen.h"
#include <stdio.h>
#include <QApplication>
#include <QCommandLineParser>
#include <QCommandLineOption>
#include <QStringList>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    QCommandLineParser p;
    QCommandLineOption widthOption(QStringList() << "w" << "width", "App width (default 320)", QString::number(DEF_W));
    QCommandLineOption heightOption(QStringList() << "H" << "height", "App height (default 240)", QString::number(DEF_H));
    QCommandLineOption urlOption(QStringList() << "u" << "url", "The default url", "http://localhost:8080/mobile.html");
    QCommandLineOption debugOption(QStringList() << "d" << "debug", "Activate debug mode", QString::number(0));
    p.setApplicationDescription("Webkit wrapper");
    p.addHelpOption();
    p.addOption(widthOption);
    p.addOption(heightOption);
    p.addOption(urlOption);
    p.addOption(debugOption);
    p.process(a);

    qint16 width = DEF_W;
    if (p.isSet("width")){
        width = p.value("width").toInt();
    }
    qint16 height = DEF_H;
    if (p.isSet("height")){
        height = p.value("height").toInt();
    }
    QString url = DEF_URL;
    if (p.isSet("url")){
        url = p.value("url");
    }
    qint16 debug = 0;
    if (p.isSet("debug")){
        debug = p.value("debug").toInt();
    }
    RadioScreen w(0, width, height, url, debug);
    w.show();
    
    return a.exec();
}
