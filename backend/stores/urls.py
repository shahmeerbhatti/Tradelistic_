from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StoreViewSet, admin_stores_list, admin_toggle_store_status

router = DefaultRouter()
router.register('', StoreViewSet, basename='store')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/list/', admin_stores_list, name='admin_stores_list'),
    path('admin/<int:store_id>/toggle-status/', admin_toggle_store_status, name='admin_toggle_store_status'),
]