#sys.path.append('/srv/www/portal.klewel.com/application/portal')
#
#os.environ['PYTHON_EGG_CACHE'] = '/srv/www/portal.klewel.com/.python-egg'
#os.environ['DJANGO_SETTINGS_MODULE'] = 'portal.settings'
#
#import django.core.handlers.wsgi
#from raven.contrib.django.middleware.wsgi import Sentry
#application = Sentry(django.core.handlers.wsgi.WSGIHandler())
#
#import portal.monitor
#portal.monitor.start(interval=1.0)
#
#os.environ["CELERY_LOADER"] = "django"

import sys
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

sys.path.append(BASE_DIR) 

sys.path.append(PROJECT_DIR)

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "portal.settings")

import django.core.handlers.wsgi
from raven.contrib.django.middleware.wsgi import Sentry
from django.core.wsgi import get_wsgi_application
application = Sentry(get_wsgi_application())

os.environ["CELERY_LOADER"] = "django"

ALLDIRS = ['/opt/local/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages']

import sys
import site

# Remember original sys.path.
prev_sys_path = list(sys.path)

# Add each new site-packages directory.
for directory in ALLDIRS:
  site.addsitedir(directory)

# Reorder sys.path so new directories at the front.
new_sys_path = []
for item in list(sys.path):
    if item not in prev_sys_path:
        new_sys_path.append(item)
        sys.path.remove(item)
sys.path[:0] = new_sys_path
