from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
import os

def api_test_view(request):
    test_file_path = os.path.join(settings.BASE_DIR, 'api_test.html')
    with open(test_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return HttpResponse(content, content_type='text/html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/stores/', include('stores.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('test/', api_test_view, name='api_test'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
