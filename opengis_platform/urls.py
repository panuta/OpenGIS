import os

from django.conf import settings
from django.conf.urls.defaults import *
from django.views.static import serve

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	(r'^', include('opengis_platform.homepage.urls')),
	(r'^', include('opengis_platform.project.urls')),
	(r'^', include('opengis_platform.workspace.urls')),
	
	(r'^accounts/', include('registration.backends.default.urls')),
	(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns('', 
        (r'^m/(?P<path>.*)$', serve, {
            'document_root' : os.path.join(os.path.dirname(__file__), "media")
        })
    )