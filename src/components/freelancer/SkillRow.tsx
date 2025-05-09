import React from 'react';
import { Skill } from '@/types/skill';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';

interface SkillRowProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: string, skillName: string) => void;
}

const SkillRow: React.FC<SkillRowProps> = ({ skill, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-lg text-gray-800">{skill.name}</h3>
        {skill.category && (
          <p className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full inline-block my-1">
            {skill.category}
          </p>
        )}
        {skill.description && <p className="text-sm text-gray-600 mt-1">{skill.description}</p>}
      </div>
      <div className="space-x-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(skill)} className="text-blue-600 border-blue-600 hover:bg-blue-50">
          <Edit3 size={18} />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onDelete(skill.id, skill.name)} className="text-red-600 border-red-600 hover:bg-red-50">
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  );
};

export default SkillRow; 