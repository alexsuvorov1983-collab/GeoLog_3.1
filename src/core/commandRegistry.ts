// GeoLog Command Registry (7.1)
import { Journal } from './journal';
import { bus } from './eventBus';

export interface Command {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  handler: () => void;
  enabled?: () => boolean;
}

const commands = new Map<string, Command>();

export const CommandRegistry = {
  register(cmd: Command) {
    commands.set(cmd.id, cmd);
  },

  execute(id: string) {
    const cmd = commands.get(id);
    if (!cmd) {
      Journal.logEvent('warning', `Команда не найдена: ${id}`, id);
      return;
    }
    if (cmd.enabled && !cmd.enabled()) {
      Journal.logEvent('warning', `Команда отключена: ${id}`, id);
      return;
    }
    try {
      cmd.handler();
      Journal.logEvent('command', `Выполнена команда: ${cmd.label}`, id);
    } catch (e) {
      Journal.logEvent('error', `Ошибка команды ${id}: ${(e as Error).message}`, id);
    }
  },

  get(id: string): Command | undefined {
    return commands.get(id);
  },

  getAll(): Command[] {
    return Array.from(commands.values());
  }
};

// Заглушка для отсутствующих команд
export function stubCommand(id: string, label: string) {
  CommandRegistry.register({
    id,
    label,
    handler: () => {
      Journal.logEvent('warning', `Команда «${label}» не реализована (заглушка)`, id);
    }
  });
}
