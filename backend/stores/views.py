from rest_framework import serializers, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Store
import logging

logger = logging.getLogger(__name__)


class StoreSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Store
        fields = [
            'id', 'seller_name', 'name', 'description', 'logo', 'logo_url', 'phone', 'email', 
            'website', 'address_line1', 'address_line2', 'city', 'state', 
            'country', 'postal_code', 'business_type', 'established_year', 
            'employee_count', 'ntn', 'strn', 'psw_registered', 'bank_profile_linked',
            'product_category', 'has_certificate_of_origin_support',
            'company_registration_no', 'ssm_registration_no',
            'customs_docs_workflow_ready', 'customs_agent_assigned',
            'miti_strategic_trade_ready', 'business_number', 'rm_export_program_id',
            'cers_account_ready', 'abn', 'export_declaration_method', 'dcrn',
            'uen', 'customs_account_active', 'tradenet_declarant_enabled',
            'eori_gb', 'cds_subscribed', 'owner',
            'created_at', 'updated_at'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            return self.context['request'].build_absolute_uri(obj.logo.url)
        return None


class StoreViewSet(viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only access their own store
        return Store.objects.filter(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Store creation request from user: {request.user}")
        logger.info(f"User type: {getattr(request.user, 'user_type', 'unknown')}")
        logger.info(f"Request data: {request.data}")
        
        # Check if user is an exporter
        if not hasattr(request.user, 'user_type') or request.user.user_type != 'exporter':
            logger.error(f"Non-exporter user {request.user} attempted to create store")
            return Response({
                'error': 'Only exporters can create stores'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already has a store
        if hasattr(request.user, 'store'):
            logger.error(f"User {request.user} already has a store")
            return Response({
                'error': 'You already have a store'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save(owner=request.user)
                logger.info(f"Store created successfully for user {request.user}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Store creation validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Store creation error: {str(e)}")
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def check_store(self, request):
        """Check if the current user has a store"""
        try:
            store = Store.objects.get(owner=request.user)
            serializer = self.get_serializer(store)
            return Response({
                'has_store': True,
                'store': serializer.data
            })
        except Store.DoesNotExist:
            return Response({
                'has_store': False,
                'store': None
            })
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def public_view(self, request, pk=None):
        """Public view of a store - accessible by anyone"""
        try:
            store = Store.objects.get(pk=pk, is_active=True)
            serializer = self.get_serializer(store)
            
            # Also get store products
            from products.models import Product
            from products.views import ProductSerializer
            
            products = Product.objects.filter(owner=store.owner).order_by('-created_at')
            product_serializer = ProductSerializer(products, many=True, context={'request': request})
            
            return Response({
                'store': serializer.data,
                'products': product_serializer.data,
                'total_products': products.count()
            })
        except Store.DoesNotExist:
            return Response({
                'error': 'Store not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# Admin-specific endpoints
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from functools import wraps
from django.contrib.auth import get_user_model

User = get_user_model()

def superadmin_required(view_func):
    """
    Decorator to ensure only super admins can access the view
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        if not getattr(request.user, 'is_superadmin', False):
            return JsonResponse({'error': 'Super admin access required'}, status=403)
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_stores_list(request):
    """
    Get all stores for admin dashboard
    """
    try:
        stores = Store.objects.select_related('owner').all()
        
        stores_data = []
        for store in stores:
            stores_data.append({
                'id': store.id,
                'name': store.name,
                'description': store.description,
                'owner': store.owner.username,
                'owner_name': f"{store.owner.first_name} {store.owner.last_name}".strip() or store.owner.username,
                'email': store.email or store.owner.email,
                'phone': store.phone,
                'website': store.website,
                'business_type': store.business_type,
                'established_year': store.established_year,
                'employee_count': store.employee_count,
                'address': f"{store.address_line1}, {store.city}, {store.country}".strip(', '),
                'is_active': store.owner.is_active,
                'logo': store.logo.url if store.logo else None,
                'created_at': store.created_at.isoformat() if store.created_at else None,
                'products_count': getattr(store.owner, 'products', []).count() if hasattr(store.owner, 'products') else 0
            })
        
        return JsonResponse(stores_data, safe=False, status=200)
        
    except Exception as e:
        print(f"Error fetching admin stores data: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch stores data'}, status=500)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@superadmin_required
def admin_toggle_store_status(request, store_id):
    """
    Toggle store status (suspend/activate store by suspending/activating the owner)
    """
    try:
        store = Store.objects.select_related('owner').get(id=store_id)
        
        # Toggle the owner's account status (which effectively suspends/activates the store)
        store.owner.is_active = not store.owner.is_active
        store.owner.save()
        
        action = 'activated' if store.owner.is_active else 'suspended'
        
        return JsonResponse({
            'success': True,
            'message': f'Store {action} successfully',
            'store_id': store_id,
            'new_status': store.owner.is_active
        }, status=200)
        
    except Store.DoesNotExist:
        return JsonResponse({'error': 'Store not found'}, status=404)
    except Exception as e:
        print(f"Error toggling store status: {str(e)}")
        return JsonResponse({'error': 'Failed to update store status'}, status=500)
