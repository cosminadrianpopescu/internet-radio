#include "tpl.h"

tpl::tpl(QString path)
{
    QFile f(path);
    f.open(QIODevice::ReadOnly | QIODevice::Text);
    this->content = QString(f.readAll());
    f.close();
}

QString tpl::parse(QMap<QString, QString> arguments)
{
    QString result = this->content;
    QMapIterator<QString, QString> it(arguments);
    while (it.hasNext()){
        it.next();
        result = result.replace("#" + it.key() + "#", it.value());
    }

    return result;
}
