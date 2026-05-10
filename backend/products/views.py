from django.shortcuts import render
from django.conf import settings
from rest_framework import serializers, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Product, ProductImage, ProductView, Favorite, Cart, CartItem, ProductOffer, Notification, CATEGORY_CHOICES, SUBCATEGORY_CHOICES
from django.db.models import Q, Avg, Count, Max
from django.utils import timezone
from transactions.models import Sale
from decimal import Decimal, InvalidOperation
import json
import base64
import mimetypes
import re
import urllib.error
import urllib.request

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        return None

class ProductSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')
    image_url = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    all_image_urls = serializers.SerializerMethodField()
    category = serializers.ChoiceField(choices=CATEGORY_CHOICES)
    subcategory = serializers.CharField(required=False, allow_blank=True)
    store_info = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image', 'image_url', 'images', 'all_image_urls', 'owner', 'created_at', 'category', 'subcategory', 'is_active', 'store_info', 'is_favorited']
    
    def get_image_url(self, obj):
        # Return main image URL for backward compatibility
        if obj.image:
            return self.context['request'].build_absolute_uri(obj.image.url)
        # If no main image, return first additional image
        elif obj.images.exists():
            return self.context['request'].build_absolute_uri(obj.images.first().image.url)
        return None
    
    def get_all_image_urls(self, obj):
        # Return all image URLs from ProductImage instances
        urls = []
        
        # If there are ProductImage instances, use only those (no duplicates)
        if obj.images.exists():
            for img in obj.images.all():
                urls.append(self.context['request'].build_absolute_uri(img.image.url))
        else:
            # Fallback to main image for backward compatibility with older products
            if obj.image:
                urls.append(self.context['request'].build_absolute_uri(obj.image.url))
                
        return urls
    
    def get_store_info(self, obj):
        # Return store information for the product owner
        if hasattr(obj.owner, 'store'):
            store = obj.owner.store
            store_data = {
                'id': store.id,
                'name': store.name,
                'description': store.description,
                'business_type': store.business_type,
                'seller_name': store.seller_name or obj.owner.username,
                'owner_username': obj.owner.username,
                'owner_email': obj.owner.email,
                'logo_url': None
            }
            if store.logo:
                store_data['logo_url'] = self.context['request'].build_absolute_uri(store.logo.url)
            return store_data
        return None
    
    def get_is_favorited(self, obj):
        """Check if the current user has favorited this product"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, product=obj).exists()
        return False

class ProductOfferSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image_url = serializers.SerializerMethodField()
    importer_username = serializers.ReadOnlyField(source='importer.username')
    exporter_username = serializers.ReadOnlyField(source='exporter.username')
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = ProductOffer
        fields = [
            'id', 'product', 'product_name', 'product_image_url',
            'importer', 'importer_username', 'exporter', 'exporter_username',
            'quantity', 'offered_price', 'counter_price', 'total_value',
            'note', 'exporter_note', 'importer_response_note',
            'importer_requirements', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['importer', 'exporter', 'status', 'created_at', 'updated_at']

    def get_product_image_url(self, obj):
        request = self.context.get('request')
        if obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        if obj.product.images.exists() and request:
            return request.build_absolute_uri(obj.product.images.first().image.url)
        return None

    def get_total_value(self, obj):
        return str(obj.total_value)

class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    offer_status = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'is_read',
            'created_at', 'actor_username', 'product_id', 'product_name',
            'offer', 'offer_status'
        ]

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None

    def get_product_id(self, obj):
        return obj.product.id if obj.product else None

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_offer_status(self, obj):
        return obj.offer.status if obj.offer else None

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all().order_by('-created_at')
        user = self.request.user
        if not (user.is_authenticated and getattr(user, 'is_superadmin', False)):
            if user.is_authenticated:
                queryset = queryset.filter(Q(is_active=True) | Q(owner=user))
            else:
                queryset = queryset.filter(is_active=True)

        name = self.request.query_params.get('name')
        category = self.request.query_params.get('category')
        subcategory = self.request.query_params.get('subcategory')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        
        if name:
            queryset = queryset.filter(name__icontains=name)  # Search only in name
        if category:
            queryset = queryset.filter(category=category)
        if subcategory:
            queryset = queryset.filter(subcategory=subcategory)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_exporter():
            raise serializers.ValidationError({
                'error': 'Only exporters can add products'
            })
        
        # Approved exporters publish directly to the marketplace.
        product = serializer.save(owner=self.request.user, is_active=True)
        
        # Handle multiple images (this will override the main image if needed)
        self.handle_product_images(product)
    
    def perform_update(self, serializer):
        """Override update to ensure only product owner can update"""
        product = self.get_object()
        if product.owner != self.request.user:
            raise serializers.ValidationError({
                'error': 'You can only update your own products'
            })
        
        # Seller edits should not leave an approved seller's product hidden.
        product = serializer.save(is_active=True)
        
        # Handle image updates
        self.handle_product_image_updates(product)
    
    def perform_destroy(self, instance):
        """Override delete to ensure only product owner can delete"""
        if instance.owner != self.request.user and not getattr(self.request.user, 'is_superadmin', False):
            raise serializers.ValidationError({
                'error': 'You can only delete your own products'
            })
        
        # Delete all associated images first
        for image in instance.images.all():
            if image.image:
                image.image.delete(save=False)  # Delete the file from storage
            image.delete()  # Delete the database record
        
        # Delete main image if it exists
        if instance.image:
            instance.image.delete(save=False)
        
        # Delete the product
        instance.delete()

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to track product views"""
        instance = self.get_object()
        
        # Track the view (with deduplication)
        try:
            # Get client IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0]
            else:
                ip = request.META.get('REMOTE_ADDR')
            
            # Get user agent
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # Get referrer
            referrer = request.META.get('HTTP_REFERER', '')
            
            # Get session ID
            session_id = request.session.session_key or ''
            
            # Deduplication logic - check for recent views from same source
            from datetime import timedelta
            recent_cutoff = timezone.now() - timedelta(seconds=30)  # 30-second window for immediate duplicates
            
            # Check for duplicate view in the last 5 minutes
            duplicate_filters = {
                'product': instance,
                'viewed_at__gte': recent_cutoff
            }
            
            if request.user.is_authenticated:
                # For authenticated users, check by user
                duplicate_filters['user'] = request.user
            else:
                # For anonymous users, check by IP + session combination
                duplicate_filters['ip_address'] = ip
                if session_id:
                    duplicate_filters['session_id'] = session_id
            
            # Only create view if no recent duplicate found
            if not ProductView.objects.filter(**duplicate_filters).exists():
                ProductView.objects.create(
                    product=instance,
                    user=request.user if request.user.is_authenticated else None,
                    ip_address=ip,
                    user_agent=user_agent,
                    referrer=referrer,
                    session_id=session_id
                )
                print(f"✅ New view recorded for product '{instance.name}'")
            else:
                print(f"⏩ Duplicate view skipped for product '{instance.name}' (within 5 minutes)")
            
        except Exception as e:
            # Don't let view tracking errors affect the product retrieval
            print(f"Error tracking product view: {str(e)}")
        
        # Return the normal product data
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to add proper error handling"""
        try:
            instance = self.get_object()
            if instance.owner != request.user and not getattr(request.user, 'is_superadmin', False):
                return Response({
                    'error': 'You can only delete your own products'
                }, status=status.HTTP_403_FORBIDDEN)
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({
                'error': f'Failed to delete product: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def toggle_status(self, request, pk=None):
        """Super admin activates or deactivates a product listing."""
        if not getattr(request.user, 'is_superadmin', False):
            return Response({'error': 'Super admin access required'}, status=status.HTTP_403_FORBIDDEN)

        product = self.get_object()
        product.is_active = not product.is_active
        product.save(update_fields=['is_active'])

        Notification.objects.create(
            recipient=product.owner,
            actor=request.user,
            product=product,
            notification_type='general',
            title='Product status updated',
            message=f'{product.name} has been {"activated" if product.is_active else "deactivated"} by SuperAdmin.'
        )

        return Response({
            'success': True,
            'product_id': product.id,
            'is_active': product.is_active,
            'message': f'Product {"activated" if product.is_active else "deactivated"} successfully'
        })
    
    def handle_product_images(self, product):
        """Handle multiple image uploads for a product"""
        request = self.request
        
        # Get all uploaded images (image_0, image_1, etc.)
        images = []
        for i in range(5):  # Support up to 5 images
            image_key = f'image_{i}'
            if image_key in request.FILES:
                images.append(request.FILES[image_key])
        
        # If no images uploaded, don't override existing main image
        if not images:
            return
        
        # Set the first image as the main image only if images were uploaded
        if images:
            product.image = images[0]
            product.save()
        
        # Save all images as ProductImage instances
        for index, image_file in enumerate(images):
            ProductImage.objects.create(
                product=product,
                image=image_file,
                order=index
            )
    
    def handle_product_image_updates(self, product):
        """Handle image updates for product editing"""
        request = self.request
        
        # Get keep_image_ids from request data - these are images to preserve
        keep_image_ids_json = request.data.get('keep_image_ids', '[]')
        try:
            keep_image_ids = json.loads(keep_image_ids_json) if keep_image_ids_json else []
        except (json.JSONDecodeError, TypeError):
            keep_image_ids = []
        keep_image_ids = [int(image_id) for image_id in keep_image_ids if str(image_id).isdigit()]
        main_image_id = request.data.get('main_image_id')
        main_new_image_index = request.data.get('main_new_image_index')
        keep_legacy_main_image = request.data.get('keep_legacy_main_image') in {'1', 'true', 'True', True}
        main_legacy_image = request.data.get('main_legacy_image') in {'1', 'true', 'True', True}
        
        # Remove images that are not in the keep list
        existing_images = product.images.all()
        for image in existing_images:
            if image.id not in keep_image_ids:
                # Delete the image file from storage
                if image.image:
                    image.image.delete(save=False)
                # Delete the database record
                image.delete()

        legacy_main_image = None
        if keep_legacy_main_image and product.image:
            legacy_main_image = product.images.filter(image=product.image.name).first()
            if legacy_main_image is None:
                legacy_main_image = ProductImage.objects.create(
                    product=product,
                    image=product.image.name,
                    order=0
                )
            keep_image_ids.append(legacy_main_image.id)
        
        # Get new uploaded images (image_0, image_1, etc.)
        new_images = []
        for i in range(5):  # Support up to 5 images
            image_key = f'image_{i}'
            if image_key in request.FILES:
                new_images.append(request.FILES[image_key])

        current_image_count = product.images.count()
        remaining_slots = max(0, 5 - current_image_count)
        if len(new_images) > remaining_slots:
            raise serializers.ValidationError({
                'error': f'You can upload up to 5 product images. Remove {len(new_images) - remaining_slots} image(s) before adding more.'
            })
        
        # Add new images as ProductImage instances
        created_images = []
        if new_images:
            # Append new uploads after kept images.
            current_max_order = product.images.aggregate(max_order=Max('order'))['max_order']
            next_order = (current_max_order + 1) if current_max_order is not None else 0
            
            for index, image_file in enumerate(new_images):
                created_image = ProductImage.objects.create(
                    product=product,
                    image=image_file,
                    order=next_order + index
                )
                created_images.append(created_image)
        
        # Update main product image by explicit seller choice, otherwise first available image.
        selected_image = None
        if main_image_id and str(main_image_id).isdigit():
            selected_image = product.images.filter(id=int(main_image_id)).first()

        if selected_image is None and main_legacy_image:
            selected_image = legacy_main_image

        if selected_image is None and main_new_image_index not in (None, ''):
            try:
                selected_image = created_images[int(main_new_image_index)]
            except (ValueError, IndexError):
                selected_image = None

        all_images = product.images.all().order_by('order')
        if selected_image is not None:
            product.image = selected_image.image
            product.is_active = True
            product.save(update_fields=['image', 'is_active'])
        elif all_images.exists():
            product.image = all_images.first().image
            product.is_active = True
            product.save(update_fields=['image', 'is_active'])
        elif not all_images.exists() and not product.image:
            # If no images at all, clear the main image
            product.image = None
            product.is_active = True
            product.save(update_fields=['image', 'is_active'])
        elif product.image:
            product.is_active = True
            product.save(update_fields=['is_active'])
    
    def create(self, request, *args, **kwargs):
        """Override create to handle file uploads properly"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        serializer = self.get_serializer(serializer.instance)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update to handle file uploads properly"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        serializer = self.get_serializer(serializer.instance)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def subcategories(self, request):
        """Get subcategories for a specific category"""
        category = request.query_params.get('category')
        
        if not category:
            return Response({
                'error': 'Category parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if category not in SUBCATEGORY_CHOICES:
            return Response({
                'error': 'Invalid category'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        subcategories = [
            {'value': value, 'label': label}
            for value, label in SUBCATEGORY_CHOICES[category]
        ]
        
        return Response({'subcategories': subcategories})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def ai_autofill(self, request):
        """AI autofill from uploaded product image, with Llama vision when configured."""
        if not request.user.is_exporter():
            return Response({'error': 'Only exporters can use product AI autofill'}, status=status.HTTP_403_FORBIDDEN)

        files = list(request.FILES.values())
        if not files:
            return Response({'error': 'Upload at least one product image first'}, status=status.HTTP_400_BAD_REQUEST)

        generated = self.generate_product_details_from_image(files[0])
        if len(files) > 1:
            generated['description'] += f' Includes {len(files)} uploaded product images for clearer buyer inspection.'

        return Response({
            'success': True,
            'title': generated['title'],
            'description': generated['description'],
            'category': generated['category'],
            'subcategory': generated['subcategory'],
            'price': str(generated.get('price') or '99.00'),
            'confidence': generated['confidence'],
            'source': generated.get('source', 'fallback'),
            'warning': generated.get('warning', ''),
            'source_images': [file.name for file in files],
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def ai_create_product(self, request):
        """Generate product details from one image and save the product."""
        if not request.user.is_exporter():
            return Response({'error': 'Only exporters can create AI products'}, status=status.HTTP_403_FORBIDDEN)

        image_file = request.FILES.get('image') or request.FILES.get('image_0')
        if not image_file:
            return Response({'error': 'Upload one product image first'}, status=status.HTTP_400_BAD_REQUEST)

        generated = self.generate_product_details_from_image(image_file)
        try:
            price = Decimal(str(generated.get('price') or '99.00'))
        except InvalidOperation:
            price = Decimal('99.00')
        if price <= 0:
            price = Decimal('99.00')

        if hasattr(image_file, 'seek'):
            image_file.seek(0)

        product = Product.objects.create(
            owner=request.user,
            name=generated['title'],
            description=generated['description'],
            price=price,
            category=generated['category'],
            subcategory=generated['subcategory'],
            image=image_file,
            is_active=True
        )

        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        ProductImage.objects.create(product=product, image=image_file, order=0)

        serializer = self.get_serializer(product)
        return Response({
            'success': True,
            'message': 'AI product created and published',
            'product': serializer.data,
            'ai': {
                'source': generated.get('source', 'fallback'),
                'confidence': generated.get('confidence', 0),
            }
        }, status=status.HTTP_201_CREATED)

    def generate_product_details_from_image(self, image_file):
        """Use Llama vision API when available, otherwise deterministic demo fallback."""
        fallback = self.fallback_product_details(image_file)
        api_key = getattr(settings, 'LLAMA_API_KEY', '')
        api_url = getattr(settings, 'LLAMA_API_URL', '')
        model = getattr(settings, 'LLAMA_MODEL', '')

        if not api_key or not api_url or not model:
            fallback['source'] = 'demo_fallback'
            fallback['warning'] = 'Vision AI is not configured, so this is a safe filename-based suggestion.'
            return fallback

        if 'guard' in model.lower():
            fallback['source'] = 'model_not_for_product_vision'
            fallback['confidence'] = min(fallback.get('confidence', 0.35), 0.35)
            fallback['warning'] = 'The configured model is a guard/safety model, not a product vision model.'
            return fallback

        try:
            image_bytes = image_file.read()
            if hasattr(image_file, 'seek'):
                image_file.seek(0)
            mime_type = getattr(image_file, 'content_type', None) or mimetypes.guess_type(image_file.name)[0] or 'image/jpeg'
            image_b64 = base64.b64encode(image_bytes).decode('ascii')
            data_url = f'data:{mime_type};base64,{image_b64}'

            allowed_categories = {
                category: [subcategory for subcategory, _ in SUBCATEGORY_CHOICES[category]]
                for category, _label in CATEGORY_CHOICES
            }
            prompt = (
                'You are a product listing assistant for an e-commerce marketplace. '
                'Look carefully at the uploaded image. Do not guess unrelated products. '
                'If the product is not clearly visible, return title "Product image needs review", '
                'category "others", subcategory "office", price "99.00", confidence 0.30. '
                'Return only valid JSON with keys: '
                'title, description, category, subcategory, price, confidence. '
                f'category and subcategory must come from this map: {json.dumps(allowed_categories)}. '
                'Use lowercase category/subcategory values exactly from the map. '
                'Price must be a realistic USD number string. '
                'Description should be 1-2 polished buyer-facing sentences.'
            )

            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': prompt},
                            {'type': 'image_url', 'image_url': {'url': data_url}},
                        ],
                    }
                ],
                'temperature': 0,
                'top_p': 0.1,
                'max_tokens': 500,
            }
            if 'gemma' in model.lower():
                payload['chat_template_kwargs'] = {'enable_thinking': False}

            request = urllib.request.Request(
                api_url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                method='POST'
            )
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(request, timeout=35) as response:
                raw = response.read().decode('utf-8')
            result = json.loads(raw)
            content = result['choices'][0]['message']['content']
            parsed = self.parse_llama_product_json(content, fallback)
            parsed['source'] = 'llama_vision'
            return parsed
        except (KeyError, ValueError, json.JSONDecodeError, urllib.error.URLError, TimeoutError, Exception) as exc:
            print(f'LLama AI fallback used: {exc}')
            fallback['source'] = 'demo_fallback_after_llama_error'
            fallback['warning'] = 'Vision API failed, so this is a safe filename-based suggestion.'
            return fallback

    def parse_llama_product_json(self, content, fallback=None):
        match = re.search(r'\{.*\}', content, flags=re.DOTALL)
        parsed = json.loads(match.group(0) if match else content)

        category_aliases = {}
        for value, label in CATEGORY_CHOICES:
            category_aliases[value] = value
            category_aliases[label.lower()] = value
            category_aliases[label.lower().replace('&', 'and')] = value

        raw_category = str(parsed.get('category') or 'others').strip().lower().replace('-', '_')
        category = category_aliases.get(raw_category) or category_aliases.get(raw_category.replace('_', ' ')) or 'others'
        if category not in SUBCATEGORY_CHOICES:
            category = 'others'

        raw_subcategory = str(parsed.get('subcategory') or '').strip().lower().replace('-', '_')
        valid_subcategories = {value for value, _label in SUBCATEGORY_CHOICES[category]}
        subcategory_aliases = {}
        for value, label in SUBCATEGORY_CHOICES[category]:
            subcategory_aliases[value] = value
            subcategory_aliases[label.lower()] = value
            subcategory_aliases[label.lower().replace('&', 'and')] = value
        subcategory = subcategory_aliases.get(raw_subcategory) or subcategory_aliases.get(raw_subcategory.replace('_', ' '))
        if subcategory not in valid_subcategories:
            subcategory = fallback.get('subcategory') if fallback and fallback.get('subcategory') in valid_subcategories else next(iter(valid_subcategories), 'office')

        title = str(parsed.get('title') or 'AI Generated Product').strip()[:255]
        description = str(parsed.get('description') or 'AI generated marketplace product listing.').strip()
        try:
            confidence = float(parsed.get('confidence') or 0.35)
        except (TypeError, ValueError):
            confidence = 0.35

        try:
            price = Decimal(str(parsed.get('price') or '99.00'))
        except InvalidOperation:
            price = Decimal('99.00')
        if price <= 0 or price > Decimal('99999.00'):
            price = Decimal(str((fallback or {}).get('price') or '99.00'))

        generic_title_terms = [
            'ai generated product',
            'product image needs review',
            'unknown product',
            'quality marketplace product',
            'uploaded product',
        ]
        title_is_generic = any(term in title.lower() for term in generic_title_terms) or len(title) < 4
        if confidence < 0.45 or title_is_generic:
            safe = fallback or self.safe_manual_review_details()
            safe['source'] = 'ai_low_confidence_review'
            safe['confidence'] = min(float(safe.get('confidence') or 0.35), 0.42)
            safe['warning'] = 'AI could not confidently identify the product from this image. Please review/edit before publishing.'
            return safe

        return {
            'title': title,
            'description': description,
            'category': category,
            'subcategory': subcategory,
            'price': str(price.quantize(Decimal('0.01'))),
            'confidence': max(0.0, min(1.0, confidence)),
        }

    def fallback_product_details(self, image_file):
        original_name = image_file.name.rsplit('.', 1)[0]
        joined_names = original_name.lower().replace('-', ' ').replace('_', ' ')
        joined_names = re.sub(r'\b(img|image|photo|screenshot|wa|whatsapp|copy|final|new|product)\b', ' ', joined_names)
        joined_names = re.sub(r'\b\d{3,}\b', ' ', joined_names)
        readable_tokens = [token for token in re.findall(r'[a-zA-Z]{3,}', joined_names) if token not in {'jpg', 'jpeg', 'png', 'webp'}]

        catalog = [
            (['laptop', 'acer', 'dell', 'hp', 'lenovo', 'macbook', 'envy', 'swift', 'computer', 'notebook'], 'electronics', 'laptops', 'Smart Performance Laptop', 'Portable computing device for study, business, browsing, office work and everyday productivity.', '599.00'),
            (['headphone', 'headphones', 'earphone', 'earphones', 'earbud', 'earbuds', 'audio', 'soundcore', 'sony', 'speaker', 'airpods'], 'electronics', 'accessories', 'Premium Wireless Audio Device', 'Clean audio accessory with comfortable design, reliable connectivity and polished daily-use performance.', '145.00'),
            (['phone', 'iphone', 'samsung', 'mobile', 'pixel', 'smartphone'], 'electronics', 'mobile_phones', 'Modern Smartphone', 'Sleek mobile device for communication, media, apps and day-to-day productivity.', '499.00'),
            (['tablet', 'ipad', 'pad', 'matepad'], 'electronics', 'tablets', 'Portable Tablet Device', 'Lightweight tablet for streaming, studying, reading, note taking and mobile productivity.', '299.00'),
            (['camera', 'canon', 'nikon', 'lens', 'dslr'], 'electronics', 'cameras', 'Digital Camera Kit', 'High-quality camera product for creators, travel photography and sharp everyday captures.', '420.00'),
            (['shirt', 'hoodie', 'cloth', 'apparel', 'fashion', 'jacket', 'coat', 'kurta', 'dress'], 'fashion', 'mens_clothing', 'Premium Everyday Apparel', 'Comfortable fashion item with clean styling, practical fit and durable everyday fabric.', '69.00'),
            (['shoe', 'shoes', 'sneaker', 'running', 'trainer', 'boot'], 'fashion', 'shoes', 'Comfort Training Shoes', 'Supportive footwear designed for comfort, movement, casual wear and active daily routines.', '89.00'),
            (['watch', 'bracelet', 'necklace', 'ring', 'jewelry', 'jewellery', 'earring'], 'fashion', 'jewelry', 'Fashion Jewelry Accessory', 'Polished accessory with a clean finish for gifting, styling and everyday presentation.', '79.00'),
            (['bag', 'backpack', 'travel'], 'fashion', 'bags', 'Classic Travel Backpack', 'Practical carry bag with clean storage, durable finish and travel-friendly everyday organization.', '79.00'),
            (['chair', 'lounge', 'furniture', 'sofa', 'table', 'desk'], 'home', 'furniture', 'Modern Lounge Furniture', 'Comfort-focused home furniture piece with clean lines, soft support and a refined living-room feel.', '189.00'),
            (['kitchen', 'ceramic', 'bowl', 'plate', 'dining', 'cup', 'cookware'], 'home', 'kitchen', 'Ceramic Kitchen Set', 'Everyday kitchen essential with a smooth finish, useful capacity and a clean dining-table presentation.', '96.00'),
            (['purifier', 'appliance', 'air', 'fan', 'lamp', 'light'], 'home', 'appliances', 'Compact Home Appliance', 'Useful home appliance built for simple daily operation, clean design and practical household comfort.', '145.00'),
            (['book', 'novel', 'magazine', 'textbook'], 'books', 'fiction', 'Curated Reading Book', 'Readable book selection for learning, leisure, focused reading and personal collection building.', '32.00'),
        ]

        safe = self.safe_manual_review_details()
        category = safe['category']
        subcategory = safe['subcategory']
        title = safe['title']
        description = safe['description']
        price = Decimal(safe['price'])
        confidence = safe['confidence']

        best_match = None
        for keywords, detected_category, detected_subcategory, detected_title, detected_description, detected_price in catalog:
            matches = sum(1 for keyword in keywords if keyword in joined_names)
            if matches and (best_match is None or matches > best_match[0]):
                best_match = (matches, detected_category, detected_subcategory, detected_title, detected_description, detected_price)

        if best_match:
            matches, category, subcategory, title, description, detected_price = best_match
            price = Decimal(detected_price)
            confidence = min(0.90, 0.62 + matches * 0.10)
        elif len(readable_tokens) >= 2:
            title = ' '.join(token.capitalize() for token in readable_tokens[:5])
            description = 'Product details were drafted from the image filename. Please review the title, category, price and description before publishing.'
            confidence = 0.45

        return {
            'title': title,
            'description': description,
            'category': category,
            'subcategory': subcategory,
            'price': str(price),
            'confidence': confidence,
        }

    def safe_manual_review_details(self):
        return {
            'title': 'Product image needs review',
            'description': 'AI could not confidently identify this product from the uploaded image. Please add an accurate title, category, price and buyer-facing description before publishing.',
            'category': 'others',
            'subcategory': 'office',
            'price': '99.00',
            'confidence': 0.30,
        }

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_store_products(self, request):
        """Get products from the current exporter's store"""
        # Check if user is an exporter
        if not request.user.is_exporter():
            return Response({
                'error': 'Only exporters can access store products'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get products owned by the current user
        queryset = Product.objects.filter(owner=request.user).order_by('-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def exporter_metrics(self, request):
        """Get dashboard metrics for the current exporter"""
        # Check if user is an exporter
        if not request.user.is_exporter():
            return Response({
                'error': 'Only exporters can access metrics'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get exporter's products
            exporter_products = Product.objects.filter(owner=request.user)
            
            # 1. Total Products Count
            total_products = exporter_products.count()
            
            # 2. Total Orders Count (sales for exporter's products)
            total_orders = Sale.objects.filter(product__in=exporter_products).count()
            
            # 3. Total Views Count (views on exporter's products)
            total_views = ProductView.objects.filter(product__in=exporter_products).count()
            
            # Additional metrics that might be useful
            # Recent views (last 30 days)
            from datetime import datetime, timedelta
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_views = ProductView.objects.filter(
                product__in=exporter_products,
                viewed_at__gte=thirty_days_ago
            ).count()
            
            # Recent orders (last 30 days)
            recent_orders = Sale.objects.filter(
                product__in=exporter_products,
                created_at__gte=thirty_days_ago
            ).count()
            
            # Most viewed products (top 5)
            most_viewed_products = list(
                exporter_products.annotate(
                    view_count=Count('views')
                ).order_by('-view_count')[:5].values('id', 'name', 'view_count')
            )
            
            return Response({
                'success': True,
                'metrics': {
                    'total_products': total_products,
                    'total_orders': total_orders,
                    'total_views': total_views,
                    'recent_views_30_days': recent_views,
                    'recent_orders_30_days': recent_orders,
                    'most_viewed_products': most_viewed_products
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error fetching exporter metrics: {str(e)}")
            return Response({
                'error': 'Failed to fetch metrics',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def analytics_details(self, request):
        """Get detailed analytics for exporter (views, favorites, sales)"""
        # Check if user is an exporter
        if not request.user.is_exporter():
            return Response({
                'error': 'Only exporters can access analytics'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get exporter's products
            exporter_products = Product.objects.filter(owner=request.user)
            
            # Get all product views (both logged-in and anonymous users)
            product_views = ProductView.objects.filter(
                product__in=exporter_products
            ).select_related('user', 'product').order_by('-viewed_at')
            
            views_data = [{
                'id': view.id,
                'user': view.user.username if view.user else 'Anonymous',
                'user_id': view.user.id if view.user else None,
                'product_name': view.product.name,
                'product_id': view.product.id,
                'viewed_at': view.viewed_at.isoformat(),
                'ip_address': view.ip_address
            } for view in product_views]
            
            # Get all favorites
            favorites = Favorite.objects.filter(
                product__in=exporter_products
            ).select_related('user', 'product').order_by('-created_at')
            
            favorites_data = [{
                'id': fav.id,
                'user': fav.user.username,
                'user_id': fav.user.id,
                'product_name': fav.product.name,
                'product_id': fav.product.id,
                'created_at': fav.created_at.isoformat()
            } for fav in favorites]
            
            # Get all sales
            sales = Sale.objects.filter(
                product__in=exporter_products
            ).select_related('customer', 'product').order_by('-created_at')
            
            sales_data = [{
                'id': sale.id,
                'sales_id': sale.sales_id,
                'customer': sale.customer.username,
                'customer_id': sale.customer.id,
                'customer_name': sale.customer_name,
                'product_name': sale.product.name,
                'product_id': sale.product.id,
                'quantity': sale.quantity,
                'total_amount': str(sale.total_amount),
                'final_total': str(sale.final_total),
                'order_status': sale.order_status,
                'payment_status': sale.payment_status,
                'created_at': sale.created_at.isoformat()
            } for sale in sales]

            from transactions.models import Review
            reviews = Review.objects.filter(
                product__in=exporter_products,
                is_approved=True
            ).select_related('user', 'product').order_by('-created_at')

            reviews_data = [{
                'id': review.id,
                'user': review.user.username,
                'user_id': review.user.id,
                'product_name': review.product.name,
                'product_id': review.product.id,
                'rating': review.rating,
                'title': review.title or '',
                'comment': review.comment,
                'verified_purchase': review.verified_purchase,
                'created_at': review.created_at.isoformat()
            } for review in reviews]
            
            return Response({
                'success': True,
                'analytics': {
                    'views': views_data,
                    'favorites': favorites_data,
                    'sales': sales_data,
                    'reviews': reviews_data
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error fetching analytics details: {str(e)}")
            return Response({
                'error': 'Failed to fetch analytics',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get reviews for a specific product"""
        try:
            product = self.get_object()
            
            # Import Review model here to avoid circular imports
            from transactions.models import Review
            
            # Get query parameters for pagination
            page = int(request.query_params.get('page', 1))
            limit = int(request.query_params.get('limit', 5))
            offset = (page - 1) * limit
            
            # Get reviews for this product
            reviews_queryset = Review.objects.filter(
                product=product,
                is_approved=True
            ).select_related('user').order_by('-created_at')
            
            # Get total count
            total_reviews = reviews_queryset.count()
            
            # Get paginated reviews
            reviews = reviews_queryset[offset:offset + limit]
            
            # Calculate average rating
            avg_rating = reviews_queryset.aggregate(avg_rating=Avg('rating'))['avg_rating']
            avg_rating = round(avg_rating, 1) if avg_rating else 0.0
            
            # Serialize reviews data
            reviews_data = []
            for review in reviews:
                reviews_data.append({
                    'id': review.id,
                    'user': {
                        'id': review.user.id,
                        'name': f"{review.user.first_name} {review.user.last_name}".strip() or review.user.username,
                        'location': f"{getattr(review.user, 'city', 'Unknown')}, {getattr(review.user, 'state_country', 'Unknown')}"
                    },
                    'rating': review.rating,
                    'title': review.title or '',
                    'comment': review.comment,
                    'date': review.created_at.isoformat(),
                    'verifiedPurchase': review.verified_purchase,
                    'helpful': review.helpful_count
                })
            
            # Calculate total pages
            total_pages = (total_reviews + limit - 1) // limit
            
            return Response({
                'reviews': reviews_data,
                'totalReviews': total_reviews,
                'totalPages': total_pages,
                'currentPage': page,
                'averageRating': avg_rating
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch reviews: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def review_eligibility(self, request, pk=None):
        """Check whether current importer can review this product after purchase."""
        try:
            from transactions.models import Review
            product = self.get_object()
            sale = Sale.objects.filter(customer=request.user, product=product).order_by('-created_at').first()
            existing_review = Review.objects.filter(user=request.user, product=product).first()

            return Response({
                'eligible': bool(sale and not existing_review),
                'has_purchase': bool(sale),
                'already_reviewed': bool(existing_review),
                'sale_id': sale.id if sale else None,
                'sales_id': sale.sales_id if sale else None,
                'reason': (
                    'Ready to review this purchase'
                    if sale and not existing_review else
                    'You have already reviewed this product'
                    if existing_review else
                    'Buy this product to leave a verified review'
                )
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_review(self, request, pk=None):
        """Submit a review for a specific product"""
        try:
            # Import Review model here to avoid circular imports
            from transactions.models import Review
            
            # Get the product
            product = self.get_object()
            
            # Get review data from request
            rating = request.data.get('rating')
            title = request.data.get('title', '')
            comment = request.data.get('comment', '')
            sale_id = request.data.get('sale_id')  # This could be database ID or sales_id
            sales_id = request.data.get('sales_id')  # Preferred: actual sales_id
            
            print(f"Review submission for product {product.id}: rating={rating}, title={title}, comment={comment}")
            print(f"Received sale_id={sale_id}, sales_id={sales_id}")
            
            # Validation
            if not all([rating, comment]):
                return Response({'error': 'Rating and comment are required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    raise ValueError()
            except ValueError:
                return Response({'error': 'Rating must be between 1 and 5'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user has already reviewed this product
            existing_review = Review.objects.filter(user=request.user, product=product).first()
            if existing_review:
                return Response({'error': 'You have already reviewed this product'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Try to find associated sale - handle both sale_id and sales_id
            sale = None
            actual_sales_id = None
            
            # Prefer sales_id if provided, otherwise try to find by sale_id (database ID)
            if sales_id:
                try:
                    from transactions.models import Sale
                    sale = Sale.objects.get(sales_id=sales_id, customer=request.user, product=product)
                    actual_sales_id = sale.sales_id
                    print(f"Found sale by sales_id: {sale.sales_id} (Order: {sale.order_id})")
                except Sale.DoesNotExist:
                    print(f"Sale with sales_id {sales_id} not found")
            elif sale_id and sale_id != 'temp-sale-id':
                try:
                    from transactions.models import Sale
                    sale = Sale.objects.get(id=sale_id, customer=request.user, product=product)
                    actual_sales_id = sale.sales_id
                    print(f"Found sale by database ID: {sale.id}, Sales_ID: {sale.sales_id}")
                except Sale.DoesNotExist:
                    print(f"Sale with database ID {sale_id} not found")
            else:
                sale = Sale.objects.filter(customer=request.user, product=product).order_by('-created_at').first()
                if sale:
                    actual_sales_id = sale.sales_id
                    print(f"Auto-linked review to latest sale: {sale.id}, Sales_ID: {sale.sales_id}")

            if not sale:
                return Response({
                    'error': 'Please buy this product before leaving a verified review'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the review
            review = Review.objects.create(
                user=request.user,
                product=product,
                sale=sale,  # Keep foreign key for backward compatibility
                sales_id=actual_sales_id,  # Store the actual sales_id
                rating=rating,
                title=title,
                comment=comment,
                verified_purchase=sale is not None,
                is_approved=True,
                created_at=timezone.now()
            )
            
            print(f"Review created successfully: ID={review.id}, Sales_ID={review.sales_id}, Product={product.name}, User={request.user.username}")
            
            return Response({
                'success': True,
                'review_id': review.id,
                'sales_id': review.sales_id,  # Return the sales_id for confirmation
                'message': 'Review submitted successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating review: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_sale(self, request, pk=None):
        """Create a sale record when user purchases this product"""
        try:
            # Import Sale model here to avoid circular imports
            from transactions.models import Sale
            import uuid
            from decimal import Decimal
            
            # Get the product
            product = self.get_object()
            
            # Get sale data from request
            quantity = int(request.data.get('quantity', 1))
            shipping_address = request.data.get('shipping_address', {})
            payment_method = request.data.get('payment_method', 'stripe_demo')
            demo_payment_id = request.data.get('demo_payment_id', '')
            demo_card_last4 = request.data.get('demo_card_last4', '')

            if payment_method != 'stripe_demo':
                return Response({
                    'error': 'Only Stripe demo checkout is enabled in this demo build'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not demo_payment_id.startswith('pi_demo_') or len(demo_card_last4) != 4:
                return Response({
                    'error': 'Demo Stripe payment was not confirmed'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"Creating sale for user: {request.user.username}, product: {product.name}, quantity: {quantity}")
            
            # Calculate pricing
            unit_price = product.price
            subtotal = unit_price * quantity
            
            shipping_cost = Decimal('0.00')
            tax_amount = Decimal('0.00')
            service_fee = Decimal('0.00')
            final_total = subtotal
            
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
                payment_method='stripe_demo',
                payment_status='completed',
                order_status='processing',
                
                # Timestamps
                created_at=timezone.now(),
                
                notes=f"Stripe demo single-product checkout. Payment ID: {demo_payment_id}. Card last4: {demo_card_last4}."
            )
            
            print(f"Sale created successfully: ID={sale.id}, Sales_ID={sale.sales_id}, Order={sale.order_id}, Customer={request.user.username}")
            
            return Response({
                'success': True,
                'sale_id': sale.id,
                'sales_id': sale.sales_id,  # Include the sales_id
                'order_id': sale.order_id,
                'message': 'Order placed successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating sale: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_favorite(self, request, pk=None):
        """Add product to user's favorites"""
        try:
            product = self.get_object()
            
            # Check if already favorited
            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                product=product
            )
            
            if created:
                return Response({
                    'success': True,
                    'message': 'Product added to favorites',
                    'is_favorited': True
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': True,
                    'message': 'Product already in favorites',
                    'is_favorited': True
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error adding favorite: {str(e)}")
            return Response({
                'error': 'Failed to add to favorites',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_favorite(self, request, pk=None):
        """Remove product from user's favorites"""
        try:
            product = self.get_object()
            
            # Try to remove the favorite
            deleted_count, _ = Favorite.objects.filter(
                user=request.user,
                product=product
            ).delete()
            
            if deleted_count > 0:
                return Response({
                    'success': True,
                    'message': 'Product removed from favorites',
                    'is_favorited': False
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': True,
                    'message': 'Product was not in favorites',
                    'is_favorited': False
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error removing favorite: {str(e)}")
            return Response({
                'error': 'Failed to remove from favorites',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_favorites(self, request):
        """Get user's favorite products"""
        try:
            # Get user's favorites
            favorites = Favorite.objects.filter(user=request.user).select_related('product')
            
            # Serialize the products
            products = [fav.product for fav in favorites]
            serializer = self.get_serializer(products, many=True)
            
            return Response({
                'success': True,
                'favorites': serializer.data,
                'count': len(products)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error fetching favorites: {str(e)}")
            return Response({
                'error': 'Failed to fetch favorites',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_to_cart(self, request, pk=None):
        """Add product to user's cart"""
        try:
            product = self.get_object()
            quantity = int(request.data.get('quantity', 1))
            
            if quantity <= 0:
                return Response({
                    'error': 'Quantity must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create user's cart
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Check if item already exists in cart
            cart_item, item_created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not item_created:
                # Item exists, update quantity
                cart_item.quantity += quantity
                cart_item.save()
                message = f'Updated quantity to {cart_item.quantity}'
            else:
                message = f'Added {quantity} item(s) to cart'
            
            return Response({
                'success': True,
                'message': message,
                'cart_item': {
                    'id': cart_item.id,
                    'product_id': product.id,
                    'product_name': product.name,
                    'quantity': cart_item.quantity,
                    'unit_price': str(product.price),
                    'total_price': str(cart_item.total_price)
                },
                'cart_total_items': cart.total_items
            }, status=status.HTTP_201_CREATED if item_created else status.HTTP_200_OK)
                
        except ValueError:
            return Response({
                'error': 'Invalid quantity provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error adding to cart: {str(e)}")
            return Response({
                'error': 'Failed to add to cart',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def get_cart(self, request):
        """Get user's cart items"""
        try:
            cart = Cart.objects.filter(user=request.user).first()
            
            if not cart:
                return Response({
                    'success': True,
                    'cart': {
                        'items': [],
                        'total_items': 0,
                        'total_price': '0.00'
                    }
                }, status=status.HTTP_200_OK)
            
            # Serialize cart items
            cart_items = []
            for item in cart.items.all():
                # Get image URL 
                image_url = ''
                if item.product.image:
                    image_url = request.build_absolute_uri(item.product.image.url)
                
                cart_items.append({
                    'id': item.id,
                    'product': {
                        'id': item.product.id,
                        'name': item.product.name,
                        'description': item.product.description,
                        'price': str(item.product.price),
                        'image': image_url
                    },
                    'quantity': item.quantity,
                    'total_price': str(item.total_price),
                    'created_at': item.created_at
                })
            
            return Response({
                'success': True,
                'cart': {
                    'items': cart_items,
                    'total_items': cart.total_items,
                    'total_price': str(cart.total_price)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error fetching cart: {str(e)}")
            return Response({
                'error': 'Failed to fetch cart',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_cart_item(self, request):
        """Update quantity of a cart item"""
        try:
            item_id = request.data.get('item_id')
            quantity = int(request.data.get('quantity', 1))
            
            if not item_id:
                return Response({
                    'error': 'item_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if quantity <= 0:
                return Response({
                    'error': 'Quantity must be greater than 0'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get cart item
            cart_item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
            
            cart_item.quantity = quantity
            cart_item.save()
            
            return Response({
                'success': True,
                'message': f'Updated quantity to {quantity}',
                'cart_item': {
                    'id': cart_item.id,
                    'quantity': cart_item.quantity,
                    'total_price': str(cart_item.total_price)
                },
                'cart_total_items': cart_item.cart.total_items
            }, status=status.HTTP_200_OK)
            
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Cart item not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({
                'error': 'Invalid quantity provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error updating cart item: {str(e)}")
            return Response({
                'error': 'Failed to update cart item',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_from_cart(self, request):
        """Remove item from cart"""
        try:
            item_id = request.data.get('item_id')
            
            if not item_id:
                return Response({
                    'error': 'item_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Remove cart item
            deleted_count, _ = CartItem.objects.filter(
                id=item_id,
                cart__user=request.user
            ).delete()
            
            if deleted_count > 0:
                # Get updated cart info
                cart = Cart.objects.filter(user=request.user).first()
                total_items = cart.total_items if cart else 0
                
                return Response({
                    'success': True,
                    'message': 'Item removed from cart',
                    'cart_total_items': total_items
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Cart item not found'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            print(f"Error removing from cart: {str(e)}")
            return Response({
                'error': 'Failed to remove from cart',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def clear_cart(self, request):
        """Clear all items from user's cart"""
        try:
            cart = Cart.objects.filter(user=request.user).first()
            
            if cart:
                deleted_count = cart.items.count()
                cart.items.all().delete()
                
                return Response({
                    'success': True,
                    'message': f'Removed {deleted_count} items from cart',
                    'cart_total_items': 0
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': True,
                    'message': 'Cart was already empty',
                    'cart_total_items': 0
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            print(f"Error clearing cart: {str(e)}")
            return Response({
                'error': 'Failed to clear cart',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def checkout(self, request):
        """Process checkout - convert cart items to sales"""
        try:
            payment_method = request.data.get('payment_method', 'stripe_demo')
            demo_payment_id = request.data.get('demo_payment_id', '')
            demo_card_last4 = request.data.get('demo_card_last4', '')

            if payment_method != 'stripe_demo':
                return Response({
                    'error': 'Only Stripe demo checkout is enabled in this demo build'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not demo_payment_id.startswith('pi_demo_') or len(demo_card_last4) != 4:
                return Response({
                    'error': 'Demo Stripe payment was not confirmed'
                }, status=status.HTTP_400_BAD_REQUEST)

            cart = Cart.objects.filter(user=request.user).first()
            
            if not cart or cart.items.count() == 0:
                return Response({
                    'error': 'Cart is empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import Sale model
            from transactions.models import Sale
            
            created_sales = []
            total_amount = 0
            
            # Process each cart item
            for cart_item in cart.items.all():
                # Generate unique order ID for this cart item
                order_id = f"ORD-{cart_item.id}-{int(timezone.now().timestamp())}"
                
                # Create sale for each cart item
                sale = Sale.objects.create(
                    customer=request.user,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.price,
                    total_amount=cart_item.total_price,
                    shipping_cost=0.00,  # Free shipping for checkout
                    tax_amount=0.00,
                    service_fee=0.00,
                    final_total=cart_item.total_price,
                    
                    # Customer info
                    customer_name=f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                    customer_email=request.user.email or f"{request.user.username}@example.com",
                    customer_phone=getattr(request.user, 'phone', ''),
                    
                    # Default shipping address - in a real app, get this from user profile
                    shipping_address_line1="Default Address",
                    shipping_address_line2="",
                    shipping_city="Default City",
                    shipping_state="Default State",
                    shipping_country="Default Country",
                    shipping_postal_code="00000",
                    
                    # Order details
                    order_id=order_id,
                    payment_method='stripe_demo',
                    payment_status='completed',
                    order_status='processing',
                    
                    # Timestamps
                    created_at=timezone.now(),
                    notes=f"Stripe demo checkout. Payment ID: {demo_payment_id}. Card last4: {demo_card_last4}."
                )
                created_sales.append({
                    'id': sale.id,
                    'sale_id': sale.id,
                    'sales_id': sale.sales_id,
                    'product_id': cart_item.product.id,
                    'product_name': cart_item.product.name,
                    'quantity': cart_item.quantity,
                    'total_price': str(cart_item.total_price)
                })
                total_amount += float(cart_item.total_price)
            
            # Clear the cart after successful checkout
            cart.items.all().delete()
            
            return Response({
                'success': True,
                'message': f'Successfully placed {len(created_sales)} orders',
                'sales': created_sales,
                'total_amount': str(total_amount),
                'total_orders': len(created_sales)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error during checkout: {str(e)}")
            return Response({
                'error': 'Checkout failed',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def make_offer(self, request, pk=None):
        """Importer sends a price offer for a product."""
        product = self.get_object()
        user = request.user

        if getattr(user, 'user_type', None) != 'importer':
            return Response({'error': 'Only importers can make offers'}, status=status.HTTP_403_FORBIDDEN)

        if product.owner == user:
            return Response({'error': 'You cannot make an offer on your own product'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(request.data.get('quantity', 1))
            offered_price = Decimal(str(request.data.get('offered_price', '0')))
        except (ValueError, InvalidOperation):
            return Response({'error': 'Quantity and offered price must be valid numbers'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({'error': 'Quantity must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        if offered_price <= 0:
            return Response({'error': 'Offered price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        offer = ProductOffer.objects.create(
            product=product,
            importer=user,
            exporter=product.owner,
            quantity=quantity,
            offered_price=offered_price,
            note=request.data.get('note', '').strip()
        )

        Notification.objects.create(
            recipient=product.owner,
            actor=user,
            product=product,
            offer=offer,
            notification_type='offer_created',
            title='New price offer',
            message=f'{user.username} offered ${offered_price} for {quantity} x {product.name}.'
        )

        serializer = ProductOfferSerializer(offer, context={'request': request})
        return Response({'success': True, 'offer': serializer.data}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def offers(self, request):
        """List offers relevant to current user."""
        user = request.user
        queryset = ProductOffer.objects.select_related('product', 'importer', 'exporter')

        if getattr(user, 'user_type', None) == 'exporter':
            queryset = queryset.filter(exporter=user)
        else:
            queryset = queryset.filter(importer=user)

        offer_status = request.query_params.get('status')
        if offer_status:
            queryset = queryset.filter(status=offer_status)

        serializer = ProductOfferSerializer(queryset[:80], many=True, context={'request': request})
        unread_count = Notification.objects.filter(recipient=user, is_read=False).count()
        return Response({'success': True, 'offers': serializer.data, 'unread_notifications': unread_count})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respond_offer(self, request):
        """Exporter accepts, rejects, or counters an importer offer."""
        user = request.user
        offer_id = request.data.get('offer_id')
        decision = request.data.get('decision')
        exporter_note = request.data.get('note', '').strip()

        if decision not in {'accept', 'reject', 'counter'}:
            return Response({'error': 'Decision must be accept, reject, or counter'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            offer = ProductOffer.objects.select_related('product', 'importer', 'exporter').get(id=offer_id)
        except ProductOffer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.exporter != user:
            return Response({'error': 'Only this product exporter can respond to the offer'}, status=status.HTTP_403_FORBIDDEN)

        if decision == 'counter':
            try:
                counter_price = Decimal(str(request.data.get('counter_price', '0')))
            except InvalidOperation:
                return Response({'error': 'Counter price must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
            if counter_price <= 0:
                return Response({'error': 'Counter price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            offer.status = 'countered'
            offer.counter_price = counter_price
            notification_type = 'offer_countered'
            title = 'Counter offer received'
            message = f'{user.username} countered with ${counter_price} for {offer.product.name}.'
        elif decision == 'accept':
            offer.status = 'accepted'
            notification_type = 'offer_accepted'
            title = 'Offer accepted'
            message = f'{user.username} accepted your offer for {offer.product.name}.'
        else:
            offer.status = 'rejected'
            notification_type = 'offer_rejected'
            title = 'Offer rejected'
            message = f'{user.username} rejected your offer for {offer.product.name}.'

        offer.exporter_note = exporter_note
        offer.save()

        if exporter_note:
            message = f'{message} Note: {exporter_note}'

        Notification.objects.create(
            recipient=offer.importer,
            actor=user,
            product=offer.product,
            offer=offer,
            notification_type=notification_type,
            title=title,
            message=message
        )

        serializer = ProductOfferSerializer(offer, context={'request': request})
        return Response({'success': True, 'offer': serializer.data})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def respond_importer_offer(self, request):
        """Importer accepts, rejects, or counters an exporter response."""
        user = request.user
        offer_id = request.data.get('offer_id')
        decision = request.data.get('decision')
        importer_note = request.data.get('note', '').strip()
        requirements = request.data.get('requirements', '').strip()

        if decision not in {'accept', 'reject', 'counter'}:
            return Response({'error': 'Decision must be accept, reject, or counter'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            offer = ProductOffer.objects.select_related('product', 'importer', 'exporter').get(id=offer_id)
        except ProductOffer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.importer != user:
            return Response({'error': 'Only this importer can respond to the offer'}, status=status.HTTP_403_FORBIDDEN)

        if offer.status not in {'accepted', 'countered', 'importer_countered', 'importer_accepted'}:
            return Response({'error': 'This offer is not waiting for an importer response'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'counter':
            try:
                new_price = Decimal(str(request.data.get('counter_price', '0')))
            except InvalidOperation:
                return Response({'error': 'Counter price must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
            if new_price <= 0:
                return Response({'error': 'Counter price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            offer.status = 'importer_countered'
            offer.offered_price = new_price
            offer.counter_price = None
            offer.importer_response_note = importer_note
            notification_type = 'offer_importer_countered'
            title = 'Importer countered your offer'
            message = f'{user.username} countered with ${new_price} for {offer.product.name}.'
        elif decision == 'accept':
            offer.status = 'importer_accepted'
            offer.importer_response_note = importer_note
            offer.importer_requirements = requirements
            notification_type = 'offer_importer_accepted'
            title = 'Importer accepted your offer'
            message = f'{user.username} accepted the negotiated offer for {offer.product.name}.'
        else:
            offer.status = 'importer_rejected'
            offer.importer_response_note = importer_note
            notification_type = 'offer_importer_rejected'
            title = 'Importer rejected your offer'
            message = f'{user.username} rejected the negotiated offer for {offer.product.name}.'

        offer.save()

        if importer_note:
            message = f'{message} Note: {importer_note}'
        if requirements and decision == 'accept':
            message = f'{message} Requirements added.'

        Notification.objects.create(
            recipient=offer.exporter,
            actor=user,
            product=offer.product,
            offer=offer,
            notification_type=notification_type,
            title=title,
            message=message
        )

        serializer = ProductOfferSerializer(offer, context={'request': request})
        return Response({'success': True, 'offer': serializer.data})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def pay_offer(self, request):
        """Create a Stripe-demo sale from an accepted/countered offer."""
        user = request.user
        offer_id = request.data.get('offer_id')
        payment_method = request.data.get('payment_method', 'stripe_demo')
        demo_payment_id = request.data.get('demo_payment_id', '')
        demo_card_last4 = request.data.get('demo_card_last4', '')
        requirements = request.data.get('requirements', '').strip()

        if payment_method != 'stripe_demo':
            return Response({'error': 'Only Stripe demo checkout is enabled in this demo build'}, status=status.HTTP_400_BAD_REQUEST)

        if not demo_payment_id.startswith('pi_demo_') or len(demo_card_last4) != 4:
            return Response({'error': 'Demo Stripe payment was not confirmed'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            offer = ProductOffer.objects.select_related('product', 'importer', 'exporter').get(id=offer_id)
        except ProductOffer.DoesNotExist:
            return Response({'error': 'Offer not found'}, status=status.HTTP_404_NOT_FOUND)

        if offer.importer != user:
            return Response({'error': 'Only this importer can pay this offer'}, status=status.HTTP_403_FORBIDDEN)

        if offer.status not in {'accepted', 'countered', 'importer_accepted'}:
            return Response({'error': 'Only accepted or countered offers can move to payment'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import uuid
            unit_price = offer.active_unit_price
            total_amount = unit_price * offer.quantity
            order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            if requirements:
                offer.importer_requirements = requirements

            sale = Sale.objects.create(
                customer=user,
                product=offer.product,
                quantity=offer.quantity,
                unit_price=unit_price,
                total_amount=total_amount,
                shipping_cost=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                service_fee=Decimal('0.00'),
                final_total=total_amount,
                customer_name=f"{user.first_name} {user.last_name}".strip() or user.username,
                customer_email=user.email,
                customer_phone=getattr(user, 'phone', ''),
                shipping_address_line1='Offer demo requirement checkout',
                shipping_address_line2='',
                shipping_city='Demo City',
                shipping_state='Demo State',
                shipping_country='Demo Country',
                shipping_postal_code='00000',
                order_id=order_id,
                payment_method='stripe_demo',
                payment_status='completed',
                order_status='processing',
                notes=(
                    f"Stripe demo offer checkout. Offer #{offer.id}. Payment ID: {demo_payment_id}. "
                    f"Card last4: {demo_card_last4}. Requirements: {requirements or offer.importer_requirements or 'None'}"
                )
            )

            offer.status = 'paid'
            offer.save()

            Notification.objects.create(
                recipient=offer.exporter,
                actor=user,
                product=offer.product,
                offer=offer,
                notification_type='offer_paid',
                title='Offer payment completed',
                message=f'{user.username} paid ${total_amount} for {offer.quantity} x {offer.product.name}.'
            )

            return Response({
                'success': True,
                'sale_id': sale.id,
                'sales_id': sale.sales_id,
                'order_id': sale.order_id,
                'message': 'Offer payment completed',
                'sale': {
                    'id': sale.id,
                    'sale_id': sale.id,
                    'sales_id': sale.sales_id,
                    'product_id': offer.product.id,
                    'product_name': offer.product.name,
                    'quantity': offer.quantity,
                    'total_price': str(total_amount),
                },
                'total_amount': str(total_amount),
                'offer': ProductOfferSerializer(offer, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': 'Offer payment failed', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def notifications(self, request):
        """List current user's notifications."""
        queryset = Notification.objects.select_related('actor', 'product', 'offer').filter(recipient=request.user)
        if request.query_params.get('unread') == '1':
            queryset = queryset.filter(is_read=False)

        serializer = NotificationSerializer(queryset[:30], many=True)
        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'success': True, 'unread_count': unread_count, 'notifications': serializer.data})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_notification_read(self, request):
        """Mark one notification or all notifications as read."""
        notification_id = request.data.get('notification_id')
        queryset = Notification.objects.filter(recipient=request.user, is_read=False)

        if notification_id == 'all':
            updated = queryset.update(is_read=True)
        else:
            updated = queryset.filter(id=notification_id).update(is_read=True)

        unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'success': True, 'updated': updated, 'unread_count': unread_count})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def recommendations(self, request):
        """Generate importer-focused product recommendations from behavior + popularity."""
        try:
            user = request.user
            from collections import Counter
            from datetime import timedelta
            from transactions.models import Sale, Review

            now = timezone.now()
            recent_cutoff = now - timedelta(days=14)
            category_weights = Counter()
            subcategory_weights = Counter()
            product_weights = Counter()
            exporter_weights = Counter()
            price_samples = []

            def add_signal(product, weight):
                if not product:
                    return
                product_weights[product.id] += weight
                if product.category:
                    category_weights[product.category] += weight
                if product.category and product.subcategory:
                    subcategory_weights[(product.category, product.subcategory)] += weight
                if product.owner_id:
                    exporter_weights[product.owner_id] += max(1, weight // 2)
                if product.price:
                    price_samples.append(float(product.price))

            view_rows = ProductView.objects.filter(user=user).select_related('product', 'product__owner').order_by('-viewed_at')[:160]
            for view in view_rows:
                add_signal(view.product, 2 if view.viewed_at >= recent_cutoff else 1)

            favorite_rows = Favorite.objects.filter(user=user).select_related('product', 'product__owner').order_by('-created_at')[:80]
            for favorite in favorite_rows:
                add_signal(favorite.product, 5)

            purchase_rows = Sale.objects.filter(customer=user).select_related('product', 'product__owner').order_by('-created_at')[:80]
            for sale in purchase_rows:
                add_signal(sale.product, min(18, 8 + int(sale.quantity or 1)))

            review_rows = Review.objects.filter(user=user, is_approved=True).select_related('product', 'product__owner').order_by('-created_at')[:80]
            for review in review_rows:
                add_signal(review.product, int(review.rating or 3) + 3)

            offer_rows = ProductOffer.objects.filter(importer=user).select_related('product', 'product__owner').order_by('-updated_at')[:80]
            offer_status_weight = {
                'pending': 4,
                'countered': 5,
                'accepted': 6,
                'importer_accepted': 8,
                'paid': 10,
            }
            for offer in offer_rows:
                add_signal(offer.product, offer_status_weight.get(offer.status, 3))

            interacted_products = set(product_weights.keys())
            avg_price = sum(price_samples) / len(price_samples) if price_samples else None

            base_queryset = Product.objects.filter(is_active=True).exclude(owner=user)
            if interacted_products:
                base_queryset = base_queryset.exclude(id__in=interacted_products)

            candidates = list(
                base_queryset.select_related('owner').annotate(
                    view_count=Count('views', distinct=True),
                    favorite_count=Count('favorited_by', distinct=True),
                    sales_count=Count('sales', distinct=True),
                    offer_count=Count('offers', distinct=True),
                    review_count=Count('reviews', filter=Q(reviews__is_approved=True), distinct=True),
                    avg_rating=Avg('reviews__rating', filter=Q(reviews__is_approved=True)),
                )[:400]
            )

            scored_products = []
            for product in candidates:
                popularity_score = (
                    float(getattr(product, 'view_count', 0)) * 0.8 +
                    float(getattr(product, 'favorite_count', 0)) * 2.5 +
                    float(getattr(product, 'sales_count', 0)) * 4.0 +
                    float(getattr(product, 'offer_count', 0)) * 1.5 +
                    float(getattr(product, 'review_count', 0)) * 1.8 +
                    float(getattr(product, 'avg_rating', 0) or 0) * 2.2
                )
                preference_score = 0.0
                preference_score += category_weights.get(product.category, 0) * 3.0
                preference_score += subcategory_weights.get((product.category, product.subcategory), 0) * 6.5
                preference_score += exporter_weights.get(product.owner_id, 0) * 0.8

                price_score = 0.0
                if avg_price and product.price:
                    difference = abs(float(product.price) - avg_price) / max(avg_price, 1)
                    price_score = max(0.0, 6.0 * (1.0 - min(difference, 1.0)))

                freshness_score = 1.5 if product.created_at >= now - timedelta(days=30) else 0.0
                total_score = preference_score + popularity_score + price_score + freshness_score
                scored_products.append((total_score, product))

            if not interacted_products:
                method = 'popular_marketplace_for_new_importer'
            else:
                method = 'amazon_style_behavioral_hybrid_v2'

            scored_products.sort(
                key=lambda item: (
                    item[0],
                    getattr(item[1], 'sales_count', 0),
                    getattr(item[1], 'favorite_count', 0),
                    getattr(item[1], 'view_count', 0),
                    item[1].created_at,
                ),
                reverse=True
            )

            final_recommendations = []
            seen_ids = set()
            category_caps = Counter()
            subcategory_caps = Counter()

            for score, product in scored_products:
                if product.id in seen_ids:
                    continue
                category_cap = 9 if interacted_products and category_weights.get(product.category, 0) else 6
                subcategory_cap = 5 if interacted_products and subcategory_weights.get((product.category, product.subcategory), 0) else 4
                if category_caps[product.category] >= category_cap:
                    continue
                if product.subcategory and subcategory_caps[(product.category, product.subcategory)] >= subcategory_cap:
                    continue
                product.recommendation_score = round(score, 2)
                final_recommendations.append(product)
                seen_ids.add(product.id)
                category_caps[product.category] += 1
                if product.subcategory:
                    subcategory_caps[(product.category, product.subcategory)] += 1
                if len(final_recommendations) >= 20:
                    break

            if len(final_recommendations) < 20:
                filler = Product.objects.filter(is_active=True).exclude(owner=user).exclude(id__in=seen_ids)
                if interacted_products:
                    filler = filler.exclude(id__in=interacted_products)
                filler = filler.annotate(
                    view_count=Count('views', distinct=True),
                    favorite_count=Count('favorited_by', distinct=True),
                    sales_count=Count('sales', distinct=True),
                    review_count=Count('reviews', filter=Q(reviews__is_approved=True), distinct=True),
                    avg_rating=Avg('reviews__rating', filter=Q(reviews__is_approved=True)),
                ).order_by('-avg_rating', '-review_count', '-sales_count', '-favorite_count', '-view_count', '-created_at')[:20 - len(final_recommendations)]
                final_recommendations.extend(list(filler))

            serializer = self.get_serializer(final_recommendations, many=True)
            
            return Response({
                'success': True,
                'recommendations': serializer.data,
                'total_count': len(final_recommendations),
                'algorithm_info': {
                    'user_favorites_count': favorite_rows.count(),
                    'user_views_count': view_rows.count(),
                    'user_purchases_count': purchase_rows.count(),
                    'user_offers_count': offer_rows.count(),
                    'user_reviews_count': review_rows.count(),
                    'total_interactions': sum(product_weights.values()),
                    'unique_interacted_products': len(interacted_products),
                    'recommendation_method': method,
                    'category_preferences': dict(category_weights),
                    'subcategory_preferences': {f"{cat}/{subcat}": count for (cat, subcat), count in subcategory_weights.items()},
                    'signals': ['views', 'favorites', 'purchases', 'offers', 'reviews', 'ratings', 'recency', 'price_affinity', 'product_popularity', 'diversity_caps']
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return Response({
                'error': 'Failed to generate recommendations',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
