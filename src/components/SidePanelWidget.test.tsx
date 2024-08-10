import { render, screen, act } from '@testing-library/react';

import * as testUtils from '~/utils/testUtils';
import * as dateUtils from '~/utils/date';

import App from '~/app';

describe('Side Panel Widget', () => {
  const originalLocation = window;

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: originalLocation,
    });
  });

  it('renders initial state without error', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('renders completed state when nothing due/new', async () => {
    const mockBuilder = new testUtils.MockDataBuilder();
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    expect(sidePanelWrapper).toBeInTheDocument();

    const completedIconClass = '.bp3-icon-confirm';
    const completedIcon = sidePanelWrapper.querySelector(completedIconClass);
    expect(completedIcon).toBeInTheDocument();
  });

  it('renders correct count when new cards added', async () => {
    const uid = 'id_1';
    const mockBuilder = new testUtils.MockDataBuilder().withCard({ uid });
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    const incompleteIconClass = '.bp3-icon-box';
    const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
    expect(incompleteIconElement).toBeInTheDocument();

    const newTag = screen.getByTestId('new-tag');
    expect(newTag).toBeInTheDocument();
    expect(newTag).toHaveTextContent('1');

    const dueTag = screen.queryByTestId('due-tag');
    expect(dueTag).not.toBeInTheDocument();
  });

  it('renders correct count when new cards added to multile decks', async () => {
    const mockBuilder = new testUtils.MockDataBuilder()
      .withTag('deck-one')
      .withCard({ uid: 'id_1', tag: 'deck-one' })
      .withCard({ uid: 'id_2', tag: 'deck-one' })
      .withTag('deck-two')
      .withCard({ uid: 'id_3', tag: 'deck-two' });
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    const incompleteIconClass = '.bp3-icon-box';
    const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
    expect(incompleteIconElement).toBeInTheDocument();

    const newTag = screen.getByTestId('new-tag');
    expect(newTag).toBeInTheDocument();
    expect(newTag).toHaveTextContent('3');

    const dueTag = screen.queryByTestId('due-tag');
    expect(dueTag).not.toBeInTheDocument();
  });

  it('renders correct count when with due cards, unstarted', async () => {
    const uid = 'id_1';
    const mockBuilder = new testUtils.MockDataBuilder().withCard({ uid }).withSession(uid, {
      nextDueDate: new Date(),
    });
    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    const incompleteIconClass = '.bp3-icon-box';
    const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
    expect(incompleteIconElement).toBeInTheDocument();

    const dueTag = screen.getByTestId('due-tag');
    expect(dueTag).toBeInTheDocument();
    expect(dueTag).toHaveTextContent('1');

    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).not.toBeInTheDocument();
  });

  it('renders correct count when with due cards, unstarted, multiple decks', async () => {
    const uid = 'id_1';
    const mockBuilder = new testUtils.MockDataBuilder()
      .withCard({ uid })
      .withSession(uid, {
        nextDueDate: new Date(),
      })
      .withTag('deck-one')
      .withCard({ uid: 'id_2', tag: 'deck-one' })
      .withSession('id_2', {
        nextDueDate: new Date(),
      });

    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    const incompleteIconClass = '.bp3-icon-box';
    const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
    expect(incompleteIconElement).toBeInTheDocument();

    const dueTag = screen.getByTestId('due-tag');
    expect(dueTag).toBeInTheDocument();
    expect(dueTag).toHaveTextContent('2');

    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).not.toBeInTheDocument();
  });

  it('decrements count when card completed', async () => {
    const card_1 = 'id_1';
    const card_2 = 'id_2';
    const mockBuilder = new testUtils.MockDataBuilder()
      // Create two cards due today
      .withCard({ uid: card_1 })
      .withCard({ uid: card_2 })
      .withSession(card_1, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      .withSession(card_2, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      // Complete one today
      .withSession(card_1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      });

    mockBuilder.mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).not.toBeInTheDocument();

    const dueTag = screen.getByTestId('due-tag');
    expect(dueTag).toBeInTheDocument();
    expect(dueTag).toHaveTextContent('1');
  });

  it('can handle case where same card is practiced twice on same day', async () => {
    const card_1 = 'id_1';
    const mockBuilder = new testUtils.MockDataBuilder()
      .withCard({ uid: card_1 })
      .withSession(card_1, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      .withSession(card_1, {
        dateCreated: new Date(),
        nextDueDate: new Date(),
      })
      .withSession(card_1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 2),
      });

    mockBuilder.mockQueryResults();
    await act(async () => {
      render(<App />);
    });

    const newTag = screen.queryByTestId('new-tag');
    expect(newTag).not.toBeInTheDocument();

    const dueTag = screen.queryByTestId('due-tag');
    expect(dueTag).not.toBeInTheDocument();
  });

  it('renders completed state when all new/due cards completed', async () => {
    const dueCard1 = 'id_1';
    const dueCard2 = 'id_2';
    const newCard1 = 'id_3';
    const newCard2 = 'id_4';

    const mockBuilder = new testUtils.MockDataBuilder()
      // Create some cards due today
      .withCard({ uid: dueCard1 })
      .withSession(dueCard1, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      .withCard({ uid: dueCard2 })
      .withSession(dueCard2, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      // Create some new cards
      .withCard({ uid: newCard1 })
      .withCard({ uid: newCard2 })
      // Complete all new/due cards
      .withSession(dueCard1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(dueCard2, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(newCard1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(newCard2, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      });

    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    expect(sidePanelWrapper).toBeInTheDocument();

    const completedIconClass = '.bp3-icon-confirm';
    const completedIcon = sidePanelWrapper.querySelector(completedIconClass);
    expect(completedIcon).toBeInTheDocument();
  });

  it('renders completed state when all new/due cards completed, multille decks', async () => {
    const dueCard1 = 'id_1';
    const dueCard2 = 'id_2';
    const newCard1 = 'id_3';
    const newCard2 = 'id_4';
    const deckTwo = 'deck-two';

    const mockBuilder = new testUtils.MockDataBuilder()
      // Create some cards due today
      .withCard({ uid: dueCard1 })
      .withSession(dueCard1, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      .withCard({ uid: dueCard2 })
      .withSession(dueCard2, {
        dateCreated: dateUtils.subtractDays(new Date(), 1),
        nextDueDate: new Date(),
      })
      // Create some new cards on another deck
      .withTag(deckTwo)
      .withCard({ uid: newCard1, tag: deckTwo })
      .withCard({ uid: newCard2, tag: deckTwo })
      // Complete all new/due cards
      .withSession(dueCard1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(dueCard2, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(newCard1, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      })
      .withSession(newCard2, {
        dateCreated: new Date(),
        nextDueDate: dateUtils.addDays(new Date(), 1),
      });

    mockBuilder.mockQueryResults();

    await act(async () => {
      render(<App />);
    });

    const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
    expect(sidePanelWrapper).toBeInTheDocument();

    const completedIconClass = '.bp3-icon-confirm';
    const completedIcon = sidePanelWrapper.querySelector(completedIconClass);
    expect(completedIcon).toBeInTheDocument();
  });

  describe('Daily Limit Set', () => {
    it('Renders correct counts when single deck, with only only new cards', async () => {
      const newCardCount = 10;

      const mockBuilder = new testUtils.MockDataBuilder().withSetting({
        dailyLimit: 5,
      });

      for (let i = 0; i < newCardCount; i++) {
        mockBuilder.withCard({ uid: `id_${i}` });
      }

      mockBuilder.mockQueryResults();

      await act(async () => {
        render(<App />);
      });

      const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
      const incompleteIconClass = '.bp3-icon-box';
      const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
      expect(incompleteIconElement).toBeInTheDocument();

      const newTag = screen.getByTestId('new-tag');
      const dueTag = screen.queryByTestId('due-tag');
      expect(newTag).toHaveTextContent('5');
      expect(dueTag).not.toBeInTheDocument();
    });

    it('Due cards should only make up 25% of daily limit when possible', async () => {
      const newCardCount = 10;
      const dueCardCount = 5;

      const mockBuilder = new testUtils.MockDataBuilder().withSetting({
        dailyLimit: 5,
      });

      // Create some cards new today
      for (let i = 0; i < newCardCount; i++) {
        mockBuilder.withCard({ uid: `id_${i}` });
      }

      // Create some cards due today
      for (let i = newCardCount; i < newCardCount + dueCardCount; i++) {
        mockBuilder.withCard({ uid: `id_${i}` }).withSession(`id_${i}`, {
          dateCreated: dateUtils.subtractDays(new Date(), 1),
          nextDueDate: new Date(),
        });
      }

      mockBuilder.mockQueryResults();

      await act(async () => {
        render(<App />);
      });

      const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
      const incompleteIconClass = '.bp3-icon-box';
      const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
      expect(incompleteIconElement).toBeInTheDocument();

      const newTag = screen.getByTestId('new-tag');
      const dueTag = screen.queryByTestId('due-tag');
      expect(newTag).toHaveTextContent('1'); // Limit new cards to 25% of limit
      expect(dueTag).toHaveTextContent('4');
    });

    it('When not enough due cards to make limit, pulls from new if available', async () => {
      const newCardCount = 10;
      const dueCardCount = 1;

      const mockBuilder = new testUtils.MockDataBuilder().withSetting({
        dailyLimit: 5,
      });

      // Create some cards new today
      for (let i = 0; i < newCardCount; i++) {
        mockBuilder.withCard({ uid: `id_${i}` });
      }

      // Create some cards due today
      for (let i = newCardCount; i < newCardCount + dueCardCount; i++) {
        mockBuilder.withCard({ uid: `id_${i}` }).withSession(`id_${i}`, {
          dateCreated: dateUtils.subtractDays(new Date(), 1),
          nextDueDate: new Date(),
        });
      }

      mockBuilder.mockQueryResults();

      await act(async () => {
        render(<App />);
      });

      const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
      const incompleteIconClass = '.bp3-icon-box';
      const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
      expect(incompleteIconElement).toBeInTheDocument();

      const newTag = screen.getByTestId('new-tag');
      const dueTag = screen.queryByTestId('due-tag');

      expect(newTag).toHaveTextContent('4');
      expect(dueTag).toHaveTextContent('1');
    });

    it('renders correct count new/due count when daily limit set is split between two decks', async () => {
      const dueCard1 = 'id_1';
      const dueCard2 = 'id_2';
      const newCard1 = 'id_3';
      const newCard2 = 'id_4';
      const deckTwo = 'deck-two';

      const mockBuilder = new testUtils.MockDataBuilder()
        .withSetting({
          dailyLimit: 2,
        }) // Create some cards due today
        .withCard({ uid: dueCard1 })
        .withSession(dueCard1, {
          dateCreated: dateUtils.subtractDays(new Date(), 1),
          nextDueDate: new Date(),
        })
        .withCard({ uid: dueCard2 })
        .withSession(dueCard2, {
          dateCreated: dateUtils.subtractDays(new Date(), 1),
          nextDueDate: new Date(),
        }) // Create some new cards on another deck
        .withTag(deckTwo)
        .withCard({ uid: newCard1, tag: deckTwo })
        .withCard({ uid: newCard2, tag: deckTwo });

      mockBuilder.mockQueryResults();

      await act(async () => {
        render(<App />);
      });

      const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
      const incompleteIconClass = '.bp3-icon-box';
      const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
      expect(incompleteIconElement).toBeInTheDocument();

      const dueTag = screen.getByTestId('due-tag');
      expect(dueTag).toBeInTheDocument();
      expect(dueTag).toHaveTextContent('1');

      const newTag = screen.getByTestId('due-tag');
      expect(newTag).toBeInTheDocument();
      expect(newTag).toHaveTextContent('1');
    });

    it.only('renders correct count when, limit set, one deck complete, but other deck has due cards', async () => {
      const mockBuilder = new testUtils.MockDataBuilder();

      mockBuilder.withSetting({
        dailyLimit: 5,
      });

      // Add completed deck
      mockBuilder.withCard({ uid: 'memo_1' }).withSession('memo_1');

      // Add deck with some new cards
      mockBuilder.withTag('deck-two');
      for (let i = 0; i < 10; i++) {
        mockBuilder.withCard({ uid: `deck_two_${i}`, tag: 'deck-two' });
      }

      mockBuilder.mockQueryResults();

      await act(async () => {
        render(<App />);
      });

      const sidePanelWrapper = screen.getByTestId('side-panel-wrapper');
      const incompleteIconClass = '.bp3-icon-box';
      const incompleteIconElement = sidePanelWrapper.querySelector(incompleteIconClass);
      expect(incompleteIconElement).toBeInTheDocument();

      // const dueTag = screen.getByTestId('due-tag');
      // expect(dueTag).toBeInTheDocument();
      // expect(dueTag).toHaveTextContent('1');

      const newTag = screen.queryByTestId('new-tag');
      expect(newTag).toBeInTheDocument();
      expect(newTag).toHaveTextContent('5');
    });
  });
});
