from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SignupViewSet, CustomTokenObtainPairView, get_reviewers,
    admin_dashboard, admin_list_users, admin_toggle_user_status,
    admin_pending_exporters, admin_approve_exporter
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'signup', SignupViewSet, basename='signup')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reviewers/', get_reviewers, name='get_reviewers'),
    
    # Super Admin Routes
    path('admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('admin/users/', admin_list_users, name='admin_list_users'),
    path('admin/users/<int:user_id>/toggle-status/', admin_toggle_user_status, name='admin_toggle_user_status'),
    path('admin/pending-exporters/', admin_pending_exporters, name='admin_pending_exporters'),
    path('admin/approve-exporter/<int:user_id>/', admin_approve_exporter, name='admin_approve_exporter'),
]