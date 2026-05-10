from django.shortcuts import render
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

from .models import Sale, Review
from products.models import Product
from stores.models import Store

User = get_user_model()


class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = '__all__'
        

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'


class SaleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing sales/transactions
    """
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Sale.objects.filter(customer=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_sale(self, request):
        """
        Create a new sale record when user places an order
        """
        try:
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            
            # Optional address data
            shipping_address = request.data.get('shipping_address', {})
            
            print(f"Creating sale for user: {request.user.username}, product_id: {product_id}, quantity: {quantity}")
            
            if not product_id:
                return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                product = Product.objects.get(id=product_id)
                print(f"Found product: {product.name} (${product.price})")
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Calculate pricing
            unit_price = product.price
            subtotal = unit_price * quantity
            
            # For demo purposes, all orders are free
            shipping_cost = Decimal('0.00')
            tax_amount = Decimal('0.00')
            service_fee = Decimal('0.00')
            final_total = Decimal('0.00')
            
            # Generate order ID
            order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            
            # Handle address data with defaults
            shipping_address_line1 = shipping_address.get('line1', 'Demo Address Line 1')
            shipping_city = shipping_address.get('city', 'Demo City')
            shipping_state = shipping_address.get('state', 'Demo State')
            shipping_country = shipping_address.get('country', 'Demo Country')
            shipping_postal_code = shipping_address.get('postal_code', '00000')
            
            # Create sale record
            sale = Sale.objects.create(
                customer=request.user,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_amount=subtotal,
                shipping_cost=shipping_cost,
                tax_amount=tax_amount,
                service_fee=service_fee,
                final_total=final_total,
                
                # Customer info
                customer_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                customer_email=request.user.email,
                customer_phone=getattr(request.user, 'phone', ''),
                
                # Shipping address with defaults
                shipping_address_line1=shipping_address_line1,
                shipping_address_line2=shipping_address.get('line2', ''),
                shipping_city=shipping_city,
                shipping_state=shipping_state,
                shipping_country=shipping_country,
                shipping_postal_code=shipping_postal_code,
                
                # Order details
                order_id=order_id,
                payment_method='promotional',
                payment_status='completed',
                order_status='delivered',
                
                # Timestamps
                created_at=timezone.now(),
                delivered_at=timezone.now(),  # For demo, mark as delivered immediately
                
                notes="Promotional order with demo pricing"
            )
            
            print(f"Sale created successfully: ID={sale.id}, Order={sale.order_id}, Customer={request.user.username}")
            
            return Response({
                'success': True,
                'sale_id': sale.id,
                'order_id': sale.order_id,
                'message': 'Order placed successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating sale: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product reviews
    """
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_review(self, request):
        """
        Create a new review for a product tied to a sale
        """
        try:
            sale_id = request.data.get('sale_id')
            product_id = request.data.get('product_id')
            rating = request.data.get('rating')
            title = request.data.get('title', '')
            comment = request.data.get('comment', '')
            
            print(f"Review submission data: sale_id={sale_id}, product_id={product_id}, rating={rating}")
            
            # Validation
            if not all([product_id, rating, comment]):
                return Response({'error': 'Product ID, rating, and comment are required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    raise ValueError()
            except ValueError:
                return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the product
            try:
                product = Product.objects.get(id=product_id)
                print(f"Found product: {product.name} (ID: {product.id})")
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if sale exists and belongs to user (optional for review submission)
            sale = None
            if sale_id and sale_id != 'temp-sale-id':
                try:
                    sale = Sale.objects.get(id=sale_id, customer=request.user)
                    print(f"Found sale: {sale.order_id} for user {request.user.username}")
                    
                    # Check if product matches the sale
                    if str(sale.product.id) != str(product_id):
                        return Response({'error': 'Product does not match the sale'}, status=status.HTTP_400_BAD_REQUEST)
                except Sale.DoesNotExist:
                    print(f"Sale {sale_id} not found for user {request.user.username}, allowing review without sale")
                    # Allow review without sale association
                    pass
            else:
                print("No sale_id provided or temp sale_id, creating review without sale association")
            
            # Check if review already exists for this user-product combination
            existing_review = Review.objects.filter(user=request.user, product=product).first()
            if existing_review:
                return Response({'error': 'You have already reviewed this product'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Create review
            review = Review.objects.create(
                user=request.user,
                product=product,
                sale=sale,  # Can be None if no sale found
                rating=rating,
                title=title,
                comment=comment,
                verified_purchase=sale is not None,  # True if tied to a sale
                is_approved=True,
                created_at=timezone.now()
            )
            
            print(f"Review created successfully: ID={review.id}, Product={product.name}, User={request.user.username}")
            
            return Response({
                'success': True,
                'review_id': review.id,
                'message': 'Review submitted successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating review: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def check_review_eligibility(self, request):
        """
        Check if user can review a product for a specific sale
        """
        sale_id = request.query_params.get('sale_id')
        product_id = request.query_params.get('product_id')
        
        if not all([sale_id, product_id]):
            return Response({'error': 'Sale ID and Product ID are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if sale exists and belongs to user
            sale = Sale.objects.get(id=sale_id, customer=request.user)
            
            # Check if product matches the sale
            if str(sale.product.id) != str(product_id):
                return Response({'eligible': False, 'reason': 'Product does not match the sale'})
            
            # Check if review already exists
            existing_review = Review.objects.filter(user=request.user, product=sale.product).exists()
            if existing_review:
                return Response({'eligible': False, 'reason': 'You have already reviewed this product'})
            
            return Response({'eligible': True, 'reason': 'You can leave a review for this product'})
            
        except Sale.DoesNotExist:
            return Response({'eligible': False, 'reason': 'Sale not found or access denied'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Admin-specific endpoints for transactions management
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, F
from django.http import JsonResponse
from functools import wraps

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
def admin_sales_data(request):
    """
    Get all sales data for admin dashboard with B2B business logic
    """
    try:
        # Get all sales with related data
        sales = Sale.objects.select_related('customer', 'product', 'product__owner').all()
        
        sales_data = []
        for sale in sales:
            # Determine if it's B2B based on order value (threshold: $1000)
            is_b2b = sale.final_total >= Decimal('1000.00')
            
            sales_data.append({
                'id': sale.id,
                'sales_id': sale.sales_id,
                'customer_name': f"{sale.customer.first_name} {sale.customer.last_name}".strip() or sale.customer.username,
                'customer_email': sale.customer.email,
                'customer_type': 'B2B' if is_b2b else 'B2C',
                'product_name': sale.product.name if sale.product else 'N/A',
                'product_id': sale.product.id if sale.product else None,
                'quantity': sale.quantity,
                'unit_price': float(sale.unit_price),
                'subtotal': float(sale.total_amount),
                'tax_amount': float(sale.tax_amount),
                'service_fee': float(sale.service_fee),
                'final_total': float(sale.final_total),
                'order_status': sale.order_status,
                'payment_status': sale.payment_status,
                'created_at': sale.created_at.isoformat() if sale.created_at else None,
                'updated_at': sale.updated_at.isoformat() if sale.updated_at else None,
                'shipping_address': ', '.join(filter(None, [
                    sale.shipping_address_line1,
                    sale.shipping_city,
                    sale.shipping_state,
                    sale.shipping_country,
                ])),
                'exporter_name': sale.product.owner.username if sale.product and sale.product.owner else 'N/A',
                'store_name': sale.product.owner.store.name if sale.product and sale.product.owner and hasattr(sale.product.owner, 'store') else 'N/A',
                'is_b2b_order': is_b2b
            })
        
        return JsonResponse(sales_data, safe=False, status=200)
        
    except Exception as e:
        print(f"Error fetching admin sales data: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch sales data'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@superadmin_required  
def admin_transactions_analytics(request):
    """
    Get transaction analytics for admin dashboard
    """
    try:
        # B2B/B2C Analysis
        total_sales = Sale.objects.count()
        b2b_sales = Sale.objects.filter(final_total__gte=Decimal('1000.00')).count()
        b2c_sales = total_sales - b2b_sales
        
        # Revenue Analysis
        total_revenue = Sale.objects.aggregate(
            total=Sum('final_total')
        )['total'] or Decimal('0.00')
        
        b2b_revenue = Sale.objects.filter(
            final_total__gte=Decimal('1000.00')
        ).aggregate(total=Sum('final_total'))['total'] or Decimal('0.00')
        
        # Average Order Values  
        from django.db.models import Avg
        avg_order_value = Sale.objects.aggregate(
            avg=Avg('final_total')
        )['avg'] or Decimal('0.00')
        
        # Status Distribution
        status_distribution = Sale.objects.values('order_status').annotate(
            count=Count('id'),
            revenue=Sum('final_total')
        )
        
        # Top Exporters by Revenue
        top_exporters = Sale.objects.values(
            'product__owner__username',
            'product__owner__first_name',
            'product__owner__last_name'
        ).annotate(
            total_sales=Count('id'),
            total_revenue=Sum('final_total')
        ).order_by('-total_revenue')[:10]
        
        # Monthly Growth (last 6 months)
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_data = Sale.objects.filter(
            created_at__gte=six_months_ago
        ).extra(
            select={'month': "strftime('%%Y-%%m', created_at)"}
        ).values('month').annotate(
            sales_count=Count('id'),
            revenue=Sum('final_total')
        ).order_by('month')
        
        analytics = {
            'total_transactions': total_sales,
            'b2b_transactions': b2b_sales,
            'b2c_transactions': b2c_sales,
            'b2b_percentage': (b2b_sales / total_sales * 100) if total_sales > 0 else 0,
            'total_revenue': float(total_revenue),
            'b2b_revenue': float(b2b_revenue),
            'b2c_revenue': float(total_revenue - b2b_revenue),
            'avg_order_value': float(avg_order_value),
            'status_distribution': list(status_distribution),
            'top_exporters': [
                {
                    'username': exp['product__owner__username'],
                    'name': f"{exp['product__owner__first_name']} {exp['product__owner__last_name']}".strip() or exp['product__owner__username'],
                    'total_sales': exp['total_sales'],
                    'total_revenue': float(exp['total_revenue'])
                }
                for exp in top_exporters
            ],
            'monthly_trends': list(monthly_data)
        }
        
        return JsonResponse(analytics, status=200)
        
    except Exception as e:
        print(f"Error fetching transaction analytics: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch analytics'}, status=500)
