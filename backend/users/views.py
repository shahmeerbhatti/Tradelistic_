from django.shortcuts import render
from rest_framework import serializers, viewsets, permissions
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from functools import wraps
from django.db.models import Sum, Count, Q
from decimal import Decimal

User = get_user_model()

# Super Admin Permission Decorator
def superadmin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.is_superadmin:
            return Response(
                {'error': 'Super admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return _wrapped_view

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'user_type', 'city', 'state_country', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
            'user_type': {'required': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            city=validated_data.get('city', ''),
            state_country=validated_data.get('state_country', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class ReviewerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'city', 'state_country')

@api_view(['GET'])
@permission_classes([AllowAny])
def get_reviewers(request):
    """Get all importer users for review generation"""
    reviewers = User.objects.filter(user_type='importer').exclude(city='').exclude(state_country='')
    serializer = ReviewerSerializer(reviewers, many=True)
    return Response(serializer.data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_type'] = self.user.user_type if self.user.user_type else 'admin'
        data['username'] = self.user.username
        data['is_superadmin'] = self.user.is_superadmin
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class SignupViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

# ============ SUPER ADMIN ENDPOINTS ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_dashboard(request):
    """Get platform statistics for super admin dashboard"""
    from products.models import Product
    from stores.models import Store
    from transactions.models import Sale
    
    total_users = User.objects.count()
    total_importers = User.objects.filter(user_type='importer').count()
    total_exporters = User.objects.filter(user_type='exporter').count()
    total_stores = Store.objects.count()
    active_stores = Store.objects.filter(is_active=True).count()
    total_products = Product.objects.count()
    total_sales = Sale.objects.count()
    
    # Calculate total revenue
    revenue_data = Sale.objects.aggregate(
        total_revenue=Sum('final_total'),
        total_service_fees=Sum('service_fee')
    )
    total_revenue = revenue_data['total_revenue'] or Decimal('0.00')
    total_service_fees = revenue_data['total_service_fees'] or Decimal('0.00')
    
    # Pending exporters (those who haven't been explicitly approved)
    pending_exporters = User.objects.filter(
        user_type='exporter',
        is_active=True
    ).count()
    
    stats = {
        'total_users': total_users,
        'total_importers': total_importers,
        'total_exporters': total_exporters,
        'pending_exporters': pending_exporters,
        'total_stores': total_stores,
        'active_stores': active_stores,
        'total_products': total_products,
        'total_sales': total_sales,
        'total_revenue': str(total_revenue),
        'total_service_fees': str(total_service_fees),
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_list_users(request):
    """List all users with filters"""
    users = User.objects.all().order_by('-date_joined')
    
    # Apply filters
    role = request.GET.get('role', None)
    status_filter = request.GET.get('status', None)
    search = request.GET.get('search', None)
    
    if role and role in ['importer', 'exporter']:
        users = users.filter(user_type=role)
    
    if status_filter == 'active':
        users = users.filter(is_active=True)
    elif status_filter == 'inactive':
        users = users.filter(is_active=False)
    
    if search:
        users = users.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search)
        )
    
    users_data = []
    for user in users:
        user_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user.user_type,
            'is_active': user.is_active,
            'is_superadmin': user.is_superadmin,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'city': user.city,
            'state_country': user.state_country,
        }
        
        # Add store info for exporters
        if user.user_type == 'exporter':
            try:
                from stores.models import Store
                store = Store.objects.get(owner=user)
                user_info['store_name'] = store.name
                user_info['store_active'] = store.is_active
            except:
                user_info['store_name'] = None
                user_info['store_active'] = None
        
        users_data.append(user_info)
    
    return Response(users_data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_toggle_user_status(request, user_id):
    """Activate or suspend a user"""
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent super admin from deactivating themselves
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot modify your own account status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'User {"activated" if user.is_active else "suspended"} successfully',
            'is_active': user.is_active
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_pending_exporters(request):
    """List exporters awaiting approval or verification"""
    from stores.models import Store
    
    # Get exporters who have created stores
    exporters = User.objects.filter(user_type='exporter', is_active=True)
    
    pending_list = []
    for exporter in exporters:
        try:
            store = Store.objects.get(owner=exporter)
            exporter_info = {
                'id': exporter.id,
                'username': exporter.username,
                'email': exporter.email,
                'first_name': exporter.first_name,
                'last_name': exporter.last_name,
                'date_joined': exporter.date_joined,
                'store_name': store.name,
                'store_id': store.id,
                'business_type': store.business_type,
                'established_year': store.established_year,
                'employee_count': store.employee_count,
                'phone': store.phone,
                'website': store.website,
                'store_active': store.is_active,
            }
            pending_list.append(exporter_info)
        except Store.DoesNotExist:
            # Exporter without store
            exporter_info = {
                'id': exporter.id,
                'username': exporter.username,
                'email': exporter.email,
                'first_name': exporter.first_name,
                'last_name': exporter.last_name,
                'date_joined': exporter.date_joined,
                'store_name': None,
                'store_id': None,
            }
            pending_list.append(exporter_info)
    
    return Response(pending_list)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_approve_exporter(request, user_id):
    """Approve an exporter account"""
    try:
        user = User.objects.get(id=user_id, user_type='exporter')
        
        # Mark as approved (ensure active)
        user.is_active = True
        user.save()
        
        # Activate their store if they have one
        try:
            from stores.models import Store
            store = Store.objects.get(owner=user)
            store.is_active = True
            store.save()
            message = f'Exporter {user.username} and their store approved successfully'
        except Store.DoesNotExist:
            message = f'Exporter {user.username} approved successfully (no store yet)'
        
        return Response({'message': message})
    except User.DoesNotExist:
        return Response(
            {'error': 'Exporter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
