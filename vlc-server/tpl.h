#ifndef TPL_H
#define TPL_H

#include <QMap>
#include <QList>
#include <QMapIterator>
#include <QObject>
#include <QFile>
#include <QtCore/QDebug>

class tpl : public QObject
{
    Q_OBJECT
public:
    tpl(QString path);
    QString parse(QMap<QString, QString> arguments);
private:
    QString content;
};

#endif // TPL_H

