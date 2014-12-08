"""
WSGI config for portal project.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "portal.settings")


#site.addsitedir("/opt/local/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages")
#sys.path.append("/Users/sandyingram/Documents/Triskel/backend-portal/")
#sys.path.append("/Users/sandyingram/Documents/Triskel/backend-portal/portal/")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))

import sys
import site

sys.path.append(BASE_DIR) 

sys.path.append(PROJECT_DIR)

ALLDIRS = ['/opt/local/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages']

os.environ["PATH"] += ":/opt/local/bin:/opt/local/sbin"

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


# This application object is used by any WSGI server configured to use this
# file. This includes Django's development server, if the WSGI_APPLICATION
# setting points here.
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# Apply WSGI middleware here.
# from helloworld.wsgi import HelloWorldApplication
# application = HelloWorldApplication(application)
