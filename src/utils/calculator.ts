/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AngleMode } from '../types';

/**
 * Evaluates a string-based mathematical expression safely.
 * Implements a recursive descent parser for high robustness.
 */
export function evaluateExpression(expression: string, angleMode: AngleMode): string {
  // Normalize symbols
  let prepared = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s+/g, '');

  if (!prepared) return '0';

  let index = 0;

  function peek(): string {
    return index < prepared.length ? prepared[index] : '';
  }

  function consume(char: string): boolean {
    if (peek() === char) {
      index++;
      return true;
    }
    return false;
  }

  function consumeString(str: string): boolean {
    if (prepared.substring(index, index + str.length) === str) {
      index += str.length;
      return true;
    }
    return false;
  }

  /**
   * Expression -> Term ((+ | -) Term)*
   */
  function parseExpression(): number {
    let result = parseTerm();
    while (true) {
      if (consume('+')) {
        result += parseTerm();
      } else if (consume('-')) {
        result -= parseTerm();
      } else {
        break;
      }
    }
    return result;
  }

  /**
   * Term -> Power ((* | / | %) Power)*
   */
  function parseTerm(): number {
    let result = parsePower();
    while (true) {
      if (consume('*')) {
        result *= parsePower();
      } else if (consume('/')) {
        const next = parsePower();
        if (next === 0) throw new Error('Divide by zero');
        result /= next;
      } else if (consume('%')) {
        const next = parsePower();
        if (next === 0) throw new Error('Modulo by zero');
        result %= next;
      } else {
        // Handle implicit multiplication (e.g., 2pi or 2(3+4))
        const p = peek();
        if (p === '(' || p === 'p' || p === 'e' || (p >= 'a' && p <= 'z' && p !== 'e')) {
          result *= parsePower();
        } else {
          break;
        }
      }
    }
    return result;
  }

  /**
   * Power -> Factor (^ Factor)*
   */
  function parsePower(): number {
    let result = parseFactor();
    while (consume('^')) {
      const exponent = parseFactor();
      result = Math.pow(result, exponent);
    }
    return result;
  }

  /**
   * Factor -> (+ | -)? Primary
   */
  function parseFactor(): number {
    if (consume('+')) {
      return parseFactor();
    }
    if (consume('-')) {
      return -parseFactor();
    }
    return parsePrimary();
  }

  /**
   * Primary -> Number | pi | e | ( Expression ) | Function ( Expression )
   */
  function parsePrimary(): number {
    const char = peek();

    // Grouping
    if (consume('(')) {
      const result = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      return result;
    }

    // Constants
    if (consumeString('pi')) {
      return Math.PI;
    }
    if (consume('e')) {
      const p = peek();
      // Ensure it is not starting another functional term like 'exp' or 'eq'
      if (!(p >= 'a' && p <= 'z')) {
        return Math.E;
      }
    }

    // Trigonometry & Logging Functions
    if (consumeString('sin(')) {
      let arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (angleMode === 'deg') {
        arg = (arg * Math.PI) / 180;
      }
      return Math.sin(arg);
    }

    if (consumeString('cos(')) {
      let arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (angleMode === 'deg') {
        arg = (arg * Math.PI) / 180;
      }
      return Math.cos(arg);
    }

    if (consumeString('tan(')) {
      let arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (angleMode === 'deg') {
        arg = (arg * Math.PI) / 180;
      }
      // Check for division by infinity bounds
      const cosVal = Math.cos(arg);
      if (Math.abs(cosVal) < 1e-15) throw new Error('Undefined');
      return Math.tan(arg);
    }

    if (consumeString('sqrt(')) {
      const arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (arg < 0) throw new Error('Domain Error');
      return Math.sqrt(arg);
    }

    if (consumeString('log(')) {
      const arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (arg <= 0) throw new Error('Domain Error');
      return Math.log10(arg);
    }

    if (consumeString('ln(')) {
      const arg = parseExpression();
      if (!consume(')')) throw new Error('Mismatched parenthesis');
      if (arg <= 0) throw new Error('Domain Error');
      return Math.log(arg);
    }

    // Read Floating numbers
    let start = index;
    let hasDecimal = false;

    while (index < prepared.length) {
      const c = prepared[index];
      if (c >= '0' && c <= '9') {
        index++;
      } else if (c === '.' && !hasDecimal) {
        hasDecimal = true;
        index++;
      } else {
        break;
      }
    }

    if (index === start) {
      throw new Error('Invalid syntax');
    }

    return parseFloat(prepared.substring(start, index));
  }

  try {
    const finalResult = parseExpression();
    if (index < prepared.length) {
      throw new Error('Extra tokens');
    }

    if (Number.isNaN(finalResult)) {
      return 'Error';
    }

    if (!Number.isFinite(finalResult)) {
      return 'Infinity';
    }

    // Precision format logic for sleek fitting
    const strResult = finalResult.toString();
    if (strResult.includes('.') && strResult.length > 12) {
      // Find fractional resolution
      return Number(finalResult.toFixed(10)).toString();
    }
    return strResult;
  } catch (err: any) {
    return err.message || 'Error';
  }
}
