# Tradelistic

Tradelistic is a full-stack B2B trade marketplace that connects exporters and importers. Exporters can create stores, publish products, manage offers and track performance, while importers can discover products, maintain a cart and negotiate with sellers. The platform also includes exporter approval, compliance guidance and a super-admin dashboard.

## Features

- Importer and exporter accounts with JWT authentication
- Exporter approval workflow managed by a super admin
- Store setup, public storefronts and product management
- Product images, search, favourites, carts and offers
- Sales, reviews, notifications and analytics
- Country-specific export guides and readiness checklists
- Company-document and export-compliance tracking
- Responsive React interface for marketplace and admin workflows

## Tech stack

- **Frontend:** React 19, React Router, Axios, Bootstrap and Font Awesome
- **Backend:** Django 5, Django REST Framework and Simple JWT
- **Database:** Microsoft SQL Server, with SQLite available for local development
- **Media:** Django file storage with Pillow image support

## Project structure

```text
Tradelistic/
|-- backend/              # Django project and REST API
|   |-- backend/          # Settings and root URL configuration
|   |-- users/            # Accounts, authentication and approvals
|   |-- stores/           # Exporter stores and compliance profiles
|   |-- products/         # Products, carts, offers and notifications
|   |-- transactions/     # Sales and reviews
|   `-- export_guides/    # Country guides and readiness checks
|-- frontend/             # React application
`-- README.md
```

## Local setup

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Optional: SQL Server and an installed ODBC driver

### 1. Clone the repository

```bash
git clone https://github.com/shahmeerbhatti/Tradelistic_.git
cd Tradelistic_
```

### 2. Start the backend

Create and activate a virtual environment, then install the Python dependencies:

```bash
cd backend
python -m venv venv
```

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

macOS/Linux:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

For the simplest local setup, create `backend/.env` with:

```env
USE_SQLITE=true
```

Apply migrations and start Django:

```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/` and Django admin at `http://localhost:8000/admin/`.

To create an administrator account:

```bash
python manage.py createsuperuser
```

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000`. The frontend currently expects the API at `http://localhost:8000/api`.

## Environment variables

The backend reads variables from the shell or `backend/.env`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `USE_SQLITE` | Use SQLite instead of SQL Server | Automatically used when `pyodbc` is unavailable |
| `SQLSERVER_DRIVER` | Installed SQL Server ODBC driver name | `ODBC Driver 17 for SQL Server` |
| `LLAMA_API_KEY` | API key for the optional product-image analysis service | Empty |
| `LLAMA_API_URL` | OpenAI-compatible vision endpoint | NVIDIA Integrate endpoint |
| `LLAMA_MODEL` | Vision-capable model identifier | Llama 4 Maverick |

Never commit `.env` files or real credentials. They are ignored by Git.

## Useful commands

Backend checks and tests:

```bash
cd backend
python manage.py check
python manage.py test
```

Frontend tests and production build:

```bash
cd frontend
npm test -- --watchAll=false
npm run build
```

## Main API areas

- `/api/users/` — registration, login, token refresh and user administration
- `/api/products/` — products, media, favourites, carts, offers and notifications
- `/api/stores/` — store profiles and store administration
- `/api/transactions/` — sales, reviews and transaction analytics
- `/api/export-guides/` — exporter-country guidance and readiness checks

## Production notes

The checked-in settings are intended for local development. Before deployment, move the Django secret key and database credentials to environment variables, disable `DEBUG`, configure allowed hosts/CORS, use production media/static storage and run Django's deployment checks.

## License

No license has been specified yet.
