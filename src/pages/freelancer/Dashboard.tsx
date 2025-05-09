import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  BarChart3, 
  DollarSign, 
  Clock, 
  Users, 
  Star, 
  Plus,
  MessageSquare,
  Calendar,
  Handshake,
  Bell,
  ListChecks,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import FreelancerBottomNavigation from '@/components/freelancer/BottomNavigation';

const mockProjects = [
  { 
    id: 1, 
    title: 'Website Redesign', 
    client: 'Tech Solutions LLC', 
    deadline: '2 days left', 
    price: 450,
    status: 'In Progress'
  },
  { 
    id: 2, 
    title: 'Mobile App UI Design', 
    client: 'Startup Ventures', 
    deadline: '5 days left', 
    price: 650,
    status: 'In Progress'
  },
];

const mockRequests = [
  { 
    id: 1, 
    title: 'WordPress Website Development', 
    client: 'John Miller', 
    budget: '$300-500',
    deadline: '7 days',
    description: 'Need a simple 5-page website with responsive design.',
    skills: ['WordPress', 'CSS', 'PHP']
  },
  { 
    id: 2, 
    title: 'Logo Design', 
    client: 'Sarah Johnson', 
    budget: '$100-200',
    deadline: '3 days',
    description: 'Clean, modern logo for a new coffee shop.',
    skills: ['Illustrator', 'Branding', 'Typography']
  },
];

const FreelancerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-[#003160] text-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Freelancer Dashboard</h1>
            <p className="text-sm opacity-80">Welcome back, {user?.name}</p>
          </div>
          <div className="flex">
            <button className="bg-[#004180] p-2 rounded-full mr-2">
              <Bell size={20} />
            </button>
            <button className="bg-[#004180] p-2 rounded-full">
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="text-xl font-bold text-[#003160]">$1,250.00</p>
            </div>
            <Button className="bg-[#003160] text-white hover:bg-[#002040]">
              Withdraw
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <Briefcase size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Active Jobs</span>
            </div>
            <p className="text-lg font-bold">2</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Earnings</span>
            </div>
            <p className="text-lg font-bold">$2,480</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center mb-1">
              <Star size={16} className="text-[#003160] mr-1" />
              <span className="text-xs text-gray-500">Rating</span>
            </div>
            <p className="text-lg font-bold">4.9</p>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 bg-white shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-center">
          <button 
            onClick={() => navigate('/freelancer/jobs')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Briefcase size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Jobs</span>
          </button>
          <button 
            onClick={() => navigate('/freelancer/messages')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Messages</span>
          </button>
          <button 
            onClick={() => navigate('/freelancer/calendar')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Calendar</span>
          </button>
          <button 
            onClick={() => navigate('/freelancer/stats')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-[#003160]" />
            </div>
            <span className="text-xs">Stats</span>
          </button>

          <button 
            onClick={() => navigate('/freelancer/skills')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <ListChecks size={20} className="text-green-700" />
            </div>
            <span className="text-xs">My Skills</span>
          </button>

          <button 
            onClick={() => navigate('/freelancer/services')}
            className="flex flex-col items-center justify-center space-y-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <Layers size={20} className="text-purple-700" />
            </div>
            <span className="text-xs">My Services</span>
          </button>
        </div>
      </div>
      
      {/* Current Projects */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Current Projects</h2>
          <button className="text-[#003160] text-sm">View All</button>
        </div>
        
        <div className="space-y-3">
          {mockProjects.map(project => (
            <div key={project.id} className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{project.title}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  {project.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                Client: {project.client}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Clock size={14} className="mr-1 text-red-500" />
                  <span className="text-red-500">{project.deadline}</span>
                </div>
                <span className="text-sm font-semibold">${project.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* New Job Requests */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">New Job Requests</h2>
          <button className="text-[#003160] text-sm">View All</button>
        </div>
        
        <div className="space-y-3">
          {mockRequests.map(request => (
            <div key={request.id} className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">{request.title}</span>
                <span className="text-xs font-medium">{request.budget}</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                <span>From: {request.client}</span>
                <span className="mx-2">•</span>
                <span>Deadline: {request.deadline}</span>
              </div>
              <p className="text-sm mb-2">
                {request.description}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {request.skills.map((skill, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-[#003160] text-white hover:bg-[#002040]"
                  size="sm"
                >
                  <Handshake size={14} className="mr-1" />
                  Send Proposal
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 border-gray-300"
                >
                  Save for Later
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <FreelancerBottomNavigation />
    </div>
  );
};

export default FreelancerDashboard;
