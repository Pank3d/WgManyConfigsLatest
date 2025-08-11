import { Markup } from 'telegraf';
import { bot } from '../../index.js';
import { safeReply, safeDeleteMessage } from '../helpers/helpers.js';

export async function startCommand(ctx) {
	const chanelId = '@wireguardvpntop';

	// Проверяем наличие ctx.from
	if (!ctx.from || !ctx.from.id) {
		console.log('Ошибка: ctx.from не определён.');
		return;
	}

	try {
		const member = await ctx.telegram.getChatMember(chanelId, ctx.from.id);

		// Обработчик для кнопки "Я подписался"
		bot.action('check_membership', async ctx => {
			if (!ctx.from || !ctx.from.id) {
				console.log('Ошибка: ctx.from не определён.');
				return;
			}

			try {
				const memberAction = await ctx.telegram.getChatMember(
					chanelId,
					ctx.from.id
				);

				if (
					memberAction.status === 'member' ||
					memberAction.status === 'administrator' ||
					memberAction.status === 'creator'
				) {
					await safeReply(ctx,
						'Нажмите сделать конфиг',
						Markup.keyboard([['Сделать конфиг']])
							.oneTime()
							.resize()
					);
					ctx.answerCbQuery();
				} else {
					ctx.answerCbQuery();
					await safeDeleteMessage(ctx);
					await safeReply(ctx,
						'Подпишитесь на наш ТГ канал, чтобы получить бесплатный конфиг https://t.me/wireguardvpntop. После подписки нажмите кнопку ниже.',
						Markup.inlineKeyboard([
							Markup.button.callback('Я подписался', 'check_membership'),
						]),
						{ parse_mode: 'Markdown' }
					);
				}
			} catch (error) {
				if (error.response && error.response.error_code === 403) {
					console.log(`Пользователь ${ctx.from.id} заблокировал бота.`);
				} else {
					console.error('Ошибка в check_membership:', error);
				}
			}
		});

		// Проверка подписки при старте команды
		if (
			member.status === 'member' ||
			member.status === 'administrator' ||
			member.status === 'creator'
		) {
			await safeReply(ctx,
				'Нажмите сделать конфиг',
				Markup.keyboard([['Сделать конфиг']])
					.oneTime()
					.resize()
			);
		} else {
			await safeReply(ctx,
				'Подпишитесь на наш ТГ канал, чтобы получить бесплатный конфиг https://t.me/wireguardvpntop. После подписки нажмите кнопку ниже.',
				Markup.inlineKeyboard([
					Markup.button.callback('Я подписался', 'check_membership'),
				]),
				{ parse_mode: 'Markdown' }
			);
		}
	} catch (error) {
		if (error.response && error.response.error_code === 403) {
			console.log(`Пользователь ${ctx.from.id} заблокировал бота.`);
		} else {
			console.error('Ошибка в startCommand:', error);
		}
	}
}
