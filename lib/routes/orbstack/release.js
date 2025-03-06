const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const rootUrl = 'https://docs.orbstack.dev';
    const currentUrl = `${rootUrl}/release-notes`;
    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = cheerio.load(response.data);

    const items = $('#VPContent > div > div > div.content > div > main > div > div h2')
        .map((_, h2) => {
            const title = $(h2).text();
            const content = $(h2).nextAll('ul').first().html();
            const versionMatch = title.match(/v[\d.]+/)[0];

            const [major, minor = 0, patch = 0] = versionMatch.match(/\d+/g).map(Number);

            const year = [
                { limit: 10904, year: 2025 },
                { limit: 10400, year: 2024 },
                { limit: 0, year: 2023 },
            ].find(({ limit }) => major * 10000 + minor * 100 + patch >= limit).year;

            const pubDate = new Date(`${title.match(/\((\w+ \d+)\)/)[1]} ${year}`).toUTCString();

            const linkHash =
                major === 0 && minor < 8
                    ? title
                          .toLowerCase()
                          .replaceAll(/[\s().\u200B-\u200D]+/g, '-')
                          .replaceAll(/^-|-$/g, '')
                    : versionMatch.replaceAll('.', '-');

            return {
                title,
                link: `${currentUrl}#${linkHash}`,
                description: content,
                pubDate,
            };
        })
        .get();

    ctx.state.data = {
        title: 'Orbstack Release Notes',
        link: currentUrl,
        item: items,
    };
};
