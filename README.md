# SwapCircle 🔄

A modern, AI-powered barter marketplace where users can exchange goods and services without money, promoting sustainability and community connections.

## 🌟 Features

### Core Functionality
- **AI-Powered Matching**: Intelligent trade suggestions based on user interests and preferences
- **Secure Trading**: JWT authentication, user verification, and trust scoring system
- **Real-time Messaging**: In-app communication for trade negotiations
- **Swap Credits**: Point system for unbalanced trades and multi-party exchanges
- **Advanced Search**: Filter by category, location, condition, and more
- **Mobile-First Design**: Responsive interface optimized for all devices

### User Experience
- **Modern UI/UX**: Clean, intuitive interface built with Material-UI and Tailwind CSS
- **Image Management**: Cloudinary integration for high-quality item photos
- **Location Services**: Proximity-based matching and meetup coordination
- **Rating System**: User reviews and trust building mechanisms
- **Category Management**: Organized item classification with visual icons

## 🚀 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with Knex.js ORM
- **JWT** authentication with OAuth 2.0 support
- **Redis** for caching and session management
- **OpenAI API** for intelligent trade matching
- **Cloudinary** for image storage and optimization

### Frontend
- **React 18** with TypeScript
- **Material-UI** for component library
- **Tailwind CSS** for custom styling
- **React Query** for state management
- **React Router** for navigation
- **Vite** for fast development and building

### Infrastructure
- **Docker** containerization
- **PostgreSQL** with optimized indexing
- **Rate limiting** and security middleware
- **Compression** and performance optimization
- **Helmet.js** for security headers

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/swapcircle.git
cd swapcircle
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swapcircle
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# OpenAI Configuration (for AI matching)
OPENAI_API_KEY=your_openai_api_key

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup
```bash
# Create PostgreSQL database
createdb swapcircle

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Start Development Servers
```bash
# Start both backend and frontend (recommended)
npm run dev

# Or start them separately:
npm run server:dev    # Backend on port 5000
npm run client:dev    # Frontend on port 3000
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles, authentication, and trust scores
- **items**: Item listings with metadata and images
- **categories**: Item classification system
- **trades**: Barter transaction management
- **messages**: In-app communication
- **reviews**: User rating and feedback system
- **swap_credits**: Point system for trades
- **credit_transactions**: Credit movement history

## 🔐 Authentication & Security

- **JWT tokens** for stateless authentication
- **Password hashing** with bcrypt
- **OAuth 2.0** integration (Google)
- **Rate limiting** to prevent abuse
- **Helmet.js** for security headers
- **Input validation** with express-validator
- **CORS** configuration for cross-origin requests

## 🤖 AI-Powered Features

### Trade Matching Algorithm
The AI system analyzes:
- User interests and skills
- Item categories and tags
- Location proximity
- Trust scores and ratings
- Trade history patterns

### Smart Suggestions
- Personalized item recommendations
- Mutual interest matching
- Value-based trade suggestions
- Location-aware recommendations

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - List items with filters
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Trades
- `GET /api/trades` - User's trades
- `POST /api/trades` - Initiate trade
- `PATCH /api/trades/:id/status` - Update trade status

### Matching
- `GET /api/matching/suggestions` - AI trade suggestions
- `GET /api/matching/item/:id` - Item-specific matches
- `GET /api/matching/mutual` - Mutual interest matches

### Search
- `GET /api/search/items` - Advanced item search
- `GET /api/search/users` - User search
- `GET /api/search/suggestions` - Search autocomplete

## 🎨 UI Components

### Material-UI Integration
- Responsive navigation drawer
- Card-based item displays
- Form components with validation
- Modal dialogs and notifications
- Responsive grid layouts

### Custom Styling
- Tailwind CSS utilities
- Custom color palette
- Smooth animations and transitions
- Mobile-first responsive design
- Accessibility compliance (WCAG)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit
npm run test:integration
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t swapcircle .

# Run container
docker run -p 5000:5000 swapcircle
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production database credentials
- Set up SSL certificates
- Configure CDN for static assets
- Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain consistent code style
- Update documentation as needed
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** team for the excellent component library
- **Tailwind CSS** for the utility-first CSS framework
- **OpenAI** for AI capabilities
- **Cloudinary** for image management
- **PostgreSQL** community for the robust database

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/swapcircle/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/swapcircle/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/swapcircle/discussions)
- **Email**: support@swapcircle.com

## 🔮 Roadmap

### Upcoming Features
- **Mobile App**: React Native application
- **Advanced Analytics**: User behavior insights
- **Social Features**: User communities and groups
- **Payment Integration**: Optional cash transactions
- **Internationalization**: Multi-language support
- **Advanced AI**: Machine learning for better matching

### Performance Improvements
- **GraphQL API**: More efficient data fetching
- **Service Workers**: Offline functionality
- **CDN Optimization**: Global asset delivery
- **Database Optimization**: Query performance improvements
- **Caching Strategy**: Redis and browser caching

---

**SwapCircle** - Building sustainable communities through intelligent barter trading. 🌱🤝