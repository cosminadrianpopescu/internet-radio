/********************************************************************************
** Form generated from reading UI file 'radioscreen.ui'
**
** Created by: Qt User Interface Compiler version 5.8.0
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_RADIOSCREEN_H
#define UI_RADIOSCREEN_H

#include <QtCore/QVariant>
#include <QtWebKitWidgets/QGraphicsWebView>
#include <QtWebKitWidgets/QWebView>
#include <QtWidgets/QAction>
#include <QtWidgets/QApplication>
#include <QtWidgets/QButtonGroup>
#include <QtWidgets/QGraphicsView>
#include <QtWidgets/QHeaderView>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QToolBar>

QT_BEGIN_NAMESPACE

class Ui_RadioScreen
{
public:
    QGraphicsView *centralWidget;
    QGraphicsWebView *webView;
    QMenuBar *menuBar;
    QToolBar *mainToolBar;
    QStatusBar *statusBar;

    void setupUi(QMainWindow *RadioScreen)
    {
        if (RadioScreen->objectName().isEmpty())
            RadioScreen->setObjectName(QStringLiteral("RadioScreen"));
        RadioScreen->resize(320, 240);
        centralWidget = new QGraphicsView(RadioScreen);
        centralWidget->setObjectName(QStringLiteral("centralWidget"));
        webView = new QGraphicsWebView(centralWidget);
        webView->setObjectName(QStringLiteral("webView"));
        webView->setGeometry(QRect(0, 0, 320, 240));
        webView->setUrl(QUrl(QStringLiteral("http://:x@localhost:8080/mobile.html")));
        RadioScreen->setCentralWidget(centralWidget);
        menuBar = new QMenuBar(RadioScreen);
        menuBar->setObjectName(QStringLiteral("menuBar"));
        menuBar->setGeometry(QRect(0, 0, 320, 19));
        RadioScreen->setMenuBar(menuBar);
        mainToolBar = new QToolBar(RadioScreen);
        mainToolBar->setObjectName(QStringLiteral("mainToolBar"));
        RadioScreen->addToolBar(Qt::TopToolBarArea, mainToolBar);
        statusBar = new QStatusBar(RadioScreen);
        statusBar->setObjectName(QStringLiteral("statusBar"));
        RadioScreen->setStatusBar(statusBar);

        retranslateUi(RadioScreen);

        QMetaObject::connectSlotsByName(RadioScreen);
    } // setupUi

    void retranslateUi(QMainWindow *RadioScreen)
    {
        RadioScreen->setWindowTitle(QApplication::translate("RadioScreen", "RadioScreen", Q_NULLPTR));
    } // retranslateUi

};

namespace Ui {
    class RadioScreen: public Ui_RadioScreen {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_RADIOSCREEN_H
