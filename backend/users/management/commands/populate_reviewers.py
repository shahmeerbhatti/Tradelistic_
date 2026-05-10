from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with reviewer users for product reviews'

    def handle(self, *args, **options):
        # Sample reviewer data matching the reviewsData.js patterns
        reviewers_data = [
            {"username": "sarah_johnson", "first_name": "Sarah", "last_name": "Johnson", "city": "New York", "state_country": "NY, USA"},
            {"username": "mike_chen", "first_name": "Mike", "last_name": "Chen", "city": "Los Angeles", "state_country": "CA, USA"},
            {"username": "emma_rodriguez", "first_name": "Emma", "last_name": "Rodriguez", "city": "Miami", "state_country": "FL, USA"},
            {"username": "david_brown", "first_name": "David", "last_name": "Brown", "city": "Toronto", "state_country": "Ontario, Canada"},
            {"username": "lisa_garcia", "first_name": "Lisa", "last_name": "Garcia", "city": "Chicago", "state_country": "IL, USA"},
            {"username": "james_wilson", "first_name": "James", "last_name": "Wilson", "city": "London", "state_country": "England, UK"},
            {"username": "anna_kumar", "first_name": "Anna", "last_name": "Kumar", "city": "Mumbai", "state_country": "Maharashtra, India"},
            {"username": "carlos_silva", "first_name": "Carlos", "last_name": "Silva", "city": "São Paulo", "state_country": "SP, Brazil"},
            {"username": "maria_lopez", "first_name": "Maria", "last_name": "Lopez", "city": "Madrid", "state_country": "Spain"},
            {"username": "robert_taylor", "first_name": "Robert", "last_name": "Taylor", "city": "Sydney", "state_country": "NSW, Australia"},
            {"username": "jenny_wang", "first_name": "Jenny", "last_name": "Wang", "city": "Shanghai", "state_country": "China"},
            {"username": "alex_petrov", "first_name": "Alex", "last_name": "Petrov", "city": "Moscow", "state_country": "Russia"},
            {"username": "olivia_martin", "first_name": "Olivia", "last_name": "Martin", "city": "Paris", "state_country": "France"},
            {"username": "tom_anderson", "first_name": "Tom", "last_name": "Anderson", "city": "Stockholm", "state_country": "Sweden"},
            {"username": "priya_sharma", "first_name": "Priya", "last_name": "Sharma", "city": "Delhi", "state_country": "India"},
            {"username": "marco_rossi", "first_name": "Marco", "last_name": "Rossi", "city": "Rome", "state_country": "Italy"},
            {"username": "sophie_bernard", "first_name": "Sophie", "last_name": "Bernard", "city": "Montreal", "state_country": "Quebec, Canada"},
            {"username": "kevin_lee", "first_name": "Kevin", "last_name": "Lee", "city": "Seoul", "state_country": "South Korea"},
            {"username": "nicole_weber", "first_name": "Nicole", "last_name": "Weber", "city": "Berlin", "state_country": "Germany"},
            {"username": "raj_patel", "first_name": "Raj", "last_name": "Patel", "city": "Ahmedabad", "state_country": "Gujarat, India"},
            {"username": "elena_popov", "first_name": "Elena", "last_name": "Popov", "city": "Kiev", "state_country": "Ukraine"},
            {"username": "hassan_ali", "first_name": "Hassan", "last_name": "Ali", "city": "Dubai", "state_country": "UAE"},
            {"username": "yuki_tanaka", "first_name": "Yuki", "last_name": "Tanaka", "city": "Tokyo", "state_country": "Japan"},
            {"username": "michelle_clark", "first_name": "Michelle", "last_name": "Clark", "city": "Vancouver", "state_country": "BC, Canada"},
            {"username": "ahmed_hassan", "first_name": "Ahmed", "last_name": "Hassan", "city": "Cairo", "state_country": "Egypt"},
            {"username": "lucy_thompson", "first_name": "Lucy", "last_name": "Thompson", "city": "Manchester", "state_country": "England, UK"},
            {"username": "pablo_martinez", "first_name": "Pablo", "last_name": "Martinez", "city": "Barcelona", "state_country": "Spain"},
            {"username": "ravi_kumar", "first_name": "Ravi", "last_name": "Kumar", "city": "Bangalore", "state_country": "Karnataka, India"},
            {"username": "natasha_volkov", "first_name": "Natasha", "last_name": "Volkov", "city": "St. Petersburg", "state_country": "Russia"},
            {"username": "jason_kim", "first_name": "Jason", "last_name": "Kim", "city": "Busan", "state_country": "South Korea"},
            {"username": "isabel_santos", "first_name": "Isabel", "last_name": "Santos", "city": "Rio de Janeiro", "state_country": "RJ, Brazil"},
            {"username": "hans_mueller", "first_name": "Hans", "last_name": "Mueller", "city": "Munich", "state_country": "Germany"},
            {"username": "fatima_al_rashid", "first_name": "Fatima", "last_name": "Al-Rashid", "city": "Riyadh", "state_country": "Saudi Arabia"},
            {"username": "claire_dubois", "first_name": "Claire", "last_name": "Dubois", "city": "Lyon", "state_country": "France"},
            {"username": "lars_olsen", "first_name": "Lars", "last_name": "Olsen", "city": "Oslo", "state_country": "Norway"},
            {"username": "mei_zhang", "first_name": "Mei", "last_name": "Zhang", "city": "Beijing", "state_country": "China"},
            {"username": "diego_fernandez", "first_name": "Diego", "last_name": "Fernandez", "city": "Mexico City", "state_country": "Mexico"},
            {"username": "kata_novak", "first_name": "Kata", "last_name": "Novak", "city": "Zagreb", "state_country": "Croatia"},
            {"username": "omar_ibrahim", "first_name": "Omar", "last_name": "Ibrahim", "city": "Istanbul", "state_country": "Turkey"},
            {"username": "anna_kowalski", "first_name": "Anna", "last_name": "Kowalski", "city": "Warsaw", "state_country": "Poland"},
            {"username": "carlos_mendoza", "first_name": "Carlos", "last_name": "Mendoza", "city": "Buenos Aires", "state_country": "Argentina"}
        ]

        created_count = 0
        for reviewer_data in reviewers_data:
            email = f"{reviewer_data['username']}@example.com"
            
            # Check if user already exists
            if not User.objects.filter(username=reviewer_data['username']).exists():
                user = User.objects.create_user(
                    username=reviewer_data['username'],
                    email=email,
                    password='defaultpassword123',  # Default password for demo users
                    first_name=reviewer_data['first_name'],
                    last_name=reviewer_data['last_name'],
                    user_type='importer',
                    city=reviewer_data['city'],
                    state_country=reviewer_data['state_country']
                )
                created_count += 1
                self.stdout.write(f"Created user: {user.username} ({user.city}, {user.state_country})")
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} reviewer users. '
                f'Total reviewer users in database: {User.objects.filter(user_type="importer").count()}'
            )
        )