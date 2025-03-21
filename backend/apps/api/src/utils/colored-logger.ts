import { Logger } from '@nestjs/common';
import chalk from 'chalk';
chalk.level = 3;

export class ColoredLogger extends Logger {
  log(message: string) {    
    super.log(chalk.cyan(message));
  }

  warn(message: string) {
    super.warn(chalk.yellow(message));
  }

  error(message: string, trace?: string) {
    super.error(chalk.red(message), trace ? chalk.gray(trace) : undefined); 
  }

  debug(message: string) {
    super.log(chalk.magenta(message)); 
  }

  verbose(message: string) {
    super.verbose(chalk.magenta(message));
  }
}
