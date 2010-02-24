import os

from django.conf import settings
from django.conf.urls.defaults import *
from django.views.static import serve

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
	(r'^backend/', include('opengis_platform.backend.urls')),
	(r'^domain/', include('opengis_platform.domain.urls')),
	
	(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    urlpatterns += patterns('', 
        (r'^m/(?P<path>.*)$', serve, {
            'document_root' : os.path.join(os.path.dirname(__file__), "media")
        })
    )