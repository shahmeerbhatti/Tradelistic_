from django.urls import path

from .views import exporter_guide_countries, exporter_guide_detail, exporter_guide_readiness


urlpatterns = [
    path('countries', exporter_guide_countries, name='exporter_guide_countries'),
    path('countries/', exporter_guide_countries, name='exporter_guide_countries_slash'),
    path('<str:exporter_country_code>', exporter_guide_detail, name='exporter_guide_detail'),
    path('<str:exporter_country_code>/', exporter_guide_detail, name='exporter_guide_detail_slash'),
    path('<str:exporter_country_code>/readiness', exporter_guide_readiness, name='exporter_guide_readiness'),
    path('<str:exporter_country_code>/readiness/', exporter_guide_readiness, name='exporter_guide_readiness_slash'),
]
