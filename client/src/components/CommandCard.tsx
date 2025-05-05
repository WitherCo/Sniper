import { Command } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandCardProps {
  command: Command;
  onEdit?: (command: Command) => void;
  onDelete?: (command: Command) => void;
}

export default function CommandCard({ command, onEdit, onDelete }: CommandCardProps) {
  return (
    <div className="bg-[#42464D] rounded-lg p-4 border border-gray-700 hover:border-[#5865F2] transition-colors cursor-pointer">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h5 className="font-semibold">{command.name}</h5>
            {command.slash && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#5865F2] rounded">Slash</span>
            )}
            {command.prefix && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-600 rounded">Prefix</span>
            )}
          </div>
          <p className="text-sm text-[#B9BBBE] mt-1">{command.description}</p>
        </div>
        <div className="flex space-x-1">
          {onEdit && (
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => onEdit(command)}
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
          
          {onDelete && (
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => onDelete(command)}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="font-mono text-xs text-[#B9BBBE]">
          {command.slash && (
            <div>
              <span className="text-[#57F287]">/</span>
              <span className="text-[#57F287]">{command.name}</span> {command.usage.split('/')[1]}
            </div>
          )}
          {command.prefix && (
            <div>
              <span className="text-[#FEE75C]">!</span>
              <span className="text-[#FEE75C]">{command.name}</span> {command.usage.split('/')[1]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
