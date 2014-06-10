inEvent Portal
==============

The main goal of inEvent is to develop new means to structure, retrieve, and share large archives of networked, and dynamically changing, multimedia recordings, mainly consisting here of meetings, video-conferences, and lectures.

Prerequist
----------

* python2.7
* python-pip

```sh
sudo aptitude install python2.7 python-dev python-pip
```

Run pip to resolve dependencies with command

```sh
sudo pip install -r requirements.txt
```

Starting
--------

In your local repository create a settings_local.py file which overwrites DEBUG to True (in development mode) and add a secret key like in below example :

```python
DEBUG = True
SECRET_KEY = "fdlet034msd09w4jfqjvl094ujopfaoo43jfa"
```

Run server with the following command

```sh
./manage runserver 127.0.0.1:8000
```

To access in a web browser under 127.0.0.1:8000
