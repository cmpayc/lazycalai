import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ITheme } from '@theme/theme.interface';
import { useTheme } from '@theme/theme.hook';

type Cell = 'X' | 'O' | null;
type Board = Cell[];

// Player is avocado, the AI is bread.
const MARKS: Record<'X' | 'O', string> = {
  X: '🥑',
  O: '🍞',
};

const EMPTY_BOARD: Board = Array(9).fill(null);

// Winning line definitions (rows, columns, diagonals).
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board: Board): Cell {
  const line = WIN_LINES.find(
    ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c],
  );
  return line ? board[line[0]] : null;
}

function emptyCells(board: Board): number[] {
  const cells: number[] = [];
  board.forEach((cell, i) => {
    if (!cell) cells.push(i);
  });
  return cells;
}

function randomCell(cells: number[]): number {
  return cells[Math.floor(Math.random() * cells.length)];
}

// Returns the index that completes a line for `player`, or -1 if none.
function findCompletingMove(board: Board, player: 'X' | 'O'): number {
  const line = WIN_LINES.find((l) => {
    const marks = l.map((i) => board[i]);
    const owned = marks.filter((m) => m === player).length;
    const empty = marks.filter((m) => m === null).length;
    return owned === 2 && empty === 1;
  });
  if (!line) return -1;
  return line[line.map((i) => board[i]).indexOf(null)];
}

// The optimal-ish move for the AI (O): win, block, center, corner, side.
function smartMove(board: Board): number {
  const win = findCompletingMove(board, 'O');
  if (win !== -1) return win;

  const block = findCompletingMove(board, 'X');
  if (block !== -1) return block;

  const cells = emptyCells(board);
  if (cells.includes(4)) return 4;

  const corners = [0, 2, 6, 8].filter((i) => cells.includes(i));
  if (corners.length) return randomCell(corners);

  return randomCell(cells);
}

// Share of moves the AI plays optimally; the rest are random. Tuned so the AI
// wins roughly 70% of games.
const AI_SMART_CHANCE = 0.85;

function aiMove(board: Board): number {
  const cells = emptyCells(board);
  if (Math.random() < AI_SMART_CHANCE) return smartMove(board);
  return randomCell(cells);
}

export default function TicTacToe({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useTheme(themeStyles);

  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const winner = getWinner(board);
  const isDraw = !winner && emptyCells(board).length === 0;
  const gameOver = !!winner || isDraw;

  const reset = () => {
    setBoard(EMPTY_BOARD);
    setIsPlayerTurn(true);
  };

  // AI takes its turn after the player moves.
  useEffect(() => {
    if (isPlayerTurn || gameOver) return;
    const timer = setTimeout(() => {
      setBoard((current) => {
        if (getWinner(current) || emptyCells(current).length === 0) {
          return current;
        }
        const move = aiMove(current);
        const next = [...current];
        next[move] = 'O';
        return next;
      });
      setIsPlayerTurn(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [isPlayerTurn, gameOver]);

  const handlePress = (index: number) => {
    if (!isPlayerTurn || board[index] || gameOver) return;
    const next = [...board];
    next[index] = 'X';
    setBoard(next);
    setIsPlayerTurn(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  let status = t('ticTacToe.yourTurn');
  if (winner === 'X') status = t('ticTacToe.youWin');
  else if (winner === 'O') status = t('ticTacToe.aiWins');
  else if (isDraw) status = t('ticTacToe.draw');
  else if (!isPlayerTurn) status = t('ticTacToe.aiTurn');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('ticTacToe.title')}</Text>
          <Text style={styles.status}>{status}</Text>

          <View style={styles.board}>
            {board.map((cell, index) => (
              <TouchableOpacity
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                style={styles.cell}
                activeOpacity={0.7}
                onPress={() => handlePress(index)}
              >
                <Text style={styles.mark}>{cell ? MARKS[cell] : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={reset}>
              <Text style={styles.actionText}>{t('ticTacToe.playAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleClose}>
              <Text style={styles.actionText}>{t('ticTacToe.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const themeStyles = (theme: ITheme) => {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: theme.color.background,
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.color.border,
      alignItems: 'center',
    },
    title: {
      ...theme.fonts.medium4,
      color: theme.color.main,
      marginBottom: 4,
    },
    status: {
      ...theme.fonts.regular2,
      color: theme.color.subText,
      marginBottom: 16,
    },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 3 * 88,
      alignSelf: 'center',
    },
    cell: {
      width: 88,
      height: 88,
      borderWidth: 1,
      borderColor: theme.color.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mark: {
      fontSize: 44,
      lineHeight: 52,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 24,
    },
    actionBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    actionText: {
      ...theme.fonts.medium3,
      color: theme.color.primary,
    },
  });
  return styles;
};
