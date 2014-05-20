# Everything that is not taken by the root URLS, eat it here! 
from django.conf.urls.defaults import patterns, url, include, handler404, handler500 #@UnusedImport
from django.contrib.auth import views as auth_views
from inevent.email_auth import MyAuthenticationForm
from inevent.views.portal import portal, get_hyperevent
from inevent.views.alignment import alignment_index, alignment_view, align, edit, delete, update 
from django.views.generic import TemplateView

urlpatterns = patterns('',
  url(r'^api/(.*)$', TemplateView.as_view(template_name='api.html')),
  url(r'^qunit/(.*)$', TemplateView.as_view(template_name='inevent/qunit.html')),
  url(r'^hyperevent/(?P<id>\d+)', get_hyperevent, name='get_hyperevent'),
  url(r'^alignment/(.*)/edit$', edit, name='hyperevent_edit'),
  url(r'^alignment/(.*)/delete$', delete, name='hyperevent_delete'),
  url(r'^alignment/(.*)/update$', update, name='hyperevent_update'),
  url(r'^alignment/(.*)/align$', align, name='hyperevent_align'),
  url(r'^alignment/(.*)/view$', alignment_view, name='alignment_view'),
  url(r'^alignment/(.*)$', alignment_index, name='alignment_index'),
)

