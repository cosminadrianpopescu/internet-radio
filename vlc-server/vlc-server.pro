QT       += core websockets
QT       -= gui

TARGET = vlc-server
CONFIG   += console debug
CONFIG   -= app_bundle

RESOURCES += res.qrc

TEMPLATE = app

SOURCES += \
    main.cpp \
    vlc-server.cpp \
    vlc-thread.cpp \
    tpl.cpp \
    vlc.cpp

HEADERS += \
    vlc-server.h \
    vlc-thread.h \
    tpl.h \
    vlc.h

LIBS += -lvlc
