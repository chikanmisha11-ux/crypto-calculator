let mode = "cryptoToMoney";

const currencies = {
  "USD": "USD — долар",
  "EUR": "EUR — євро",
  "UAH": "UAH — гривня",
  "CZK": "CZK — чеська крона"
};

const coinSelect = document.getElementById("coin");
const secondCoinSelect = document.getElementById("secondCoin");

const coinList = document.getElementById("coinList");
const secondCoinList =
  document.getElementById("secondCoinList");

const currencySelect =
  document.getElementById("currency");

const secondCurrencySelect =
  document.getElementById("secondCurrency");

const coins = {};

async function loadBinanceCoins() {

  try {

    const response = await fetch(
      "https://api.binance.com/api/v3/exchangeInfo"
    );

    const data = await response.json();

    const usdtPairs = data.symbols.filter(
      item =>

        item.quoteAsset === "USDT" &&
        item.status === "TRADING"
    );

    const uniqueCoins = [

      ...new Set(
        usdtPairs.map(item =>
          item.baseAsset
        )
      )

    ].sort();

    uniqueCoins.forEach(symbol => {

      coins[symbol] = symbol;

      coinList.innerHTML += `
        <option value="${symbol}">
      `;

      secondCoinList.innerHTML += `
        <option value="${symbol}">
      `;
    });

  } catch (error) {

    console.log(error);

    document.getElementById(
      "result"
    ).innerHTML =
      "Не вдалося завантажити Binance API";
  }
}

for (let currency in currencies) {

  currencySelect.innerHTML += `
    <option value="${currency}">
      ${currencies[currency]}
    </option>
  `;

  secondCurrencySelect.innerHTML += `
    <option value="${currency}">
      ${currencies[currency]}
    </option>
  `;
}

document.getElementById(
  "cryptoToMoneyBtn"
).onclick = function () {

  mode = "cryptoToMoney";

  updateMode(this);
};

document.getElementById(
  "moneyToMoneyBtn"
).onclick = function () {

  mode = "moneyToMoney";

  updateMode(this);
};

document.getElementById(
  "cryptoToCryptoBtn"
).onclick = function () {

  mode = "cryptoToCrypto";

  updateMode(this);
};

function updateMode(activeButton) {

  document
    .querySelectorAll(".switch-box button")
    .forEach(btn => {

      btn.classList.remove("active");
    });

  activeButton.classList.add("active");

  document.getElementById(
    "coinBox"
  ).style.display = "none";

  document.getElementById(
    "currencyBox"
  ).style.display = "none";

  document.getElementById(
    "secondCurrencyBox"
  ).style.display = "none";

  document.getElementById(
    "secondCoinBox"
  ).style.display = "none";

  if (mode === "cryptoToMoney") {

    coinBox.style.display = "block";

    currencyBox.style.display = "block";
  }

  if (mode === "moneyToMoney") {

    currencyBox.style.display = "block";

    secondCurrencyBox.style.display =
      "block";
  }

  if (mode === "cryptoToCrypto") {

    coinBox.style.display = "block";

    secondCoinBox.style.display =
      "block";
  }

  document.getElementById(
    "result"
  ).innerHTML = "Результат буде тут";
}

updateMode(
  document.getElementById(
    "cryptoToMoneyBtn"
  )
);

loadBinanceCoins();

async function calculate() {

  const amount = Number(
    document.getElementById(
      "amount"
    ).value
  );

  const coin =
    coinSelect.value.toUpperCase();

  const secondCoin =
    secondCoinSelect.value.toUpperCase();

  const currency =
    currencySelect.value;

  const secondCurrency =
    secondCurrencySelect.value;

  const result =
    document.getElementById("result");

  if (!amount || amount <= 0) {

    result.innerHTML =
      "Введи правильну суму";

    return;
  }

  result.innerHTML =
    "Завантаження курсу...";

  try {

    if (mode === "cryptoToMoney") {

      const cryptoUsdPrice =
        await getBinancePrice(coin);

      const moneyRate =
        await convertMoney(
          "USD",
          currency,
          1
        );

      const total =

        amount *
        cryptoUsdPrice *
        moneyRate;

      result.innerHTML = `
        ${amount} ${coin}<br>

        ≈ ${formatNumber(total)}
        ${currency}

        <br><br>

        <small>Binance API</small>
      `;
    }

    if (mode === "moneyToCrypto") {

      const cryptoUsdPrice =
        await getBinancePrice(coin);

      const amountInUsd =
        await convertMoney(
          currency,
          "USD",
          amount
        );

      const total =
        amountInUsd /
        cryptoUsdPrice;

      result.innerHTML = `
        ${amount} ${currency}<br>

        ≈ ${formatCrypto(total)}
        ${coin}

        <br><br>

        <small>Binance API</small>
      `;
    }

    if (mode === "moneyToMoney") {

      const total =
        await convertMoney(
          currency,
          secondCurrency,
          amount
        );

      result.innerHTML = `
        ${amount} ${currency}<br>

        ≈ ${formatNumber(total)}
        ${secondCurrency}
      `;
    }

    if (mode === "cryptoToCrypto") {

      const firstPrice =
        await getBinancePrice(coin);

      const secondPrice =
        await getBinancePrice(secondCoin);

      const total =

        amount *
        firstPrice /
        secondPrice;

      result.innerHTML = `
        ${amount} ${coin}<br>

        ≈ ${formatCrypto(total)}
        ${secondCoin}

        <br><br>

        <small>
          Binance API через USDT
        </small>
      `;
    }

  } catch (error) {

    console.log(error);

    result.innerHTML =
      "Помилка завантаження курсу";
  }
}

async function getBinancePrice(symbol) {

  const url =
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!data.price) {

    throw new Error(
      "Монета недоступна"
    );
  }

  return Number(data.price);
}

async function convertMoney(from, to, amount) {
  if (from === to) {
    return amount;
  }

  const url =
    `https://open.er-api.com/v6/latest/${from}`;

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!data.rates || !data.rates[to]) {
    throw new Error("Курс валюти недоступний");
  }

  return amount * data.rates[to];
}

function formatNumber(number) {

  return Number(number)
    .toLocaleString(
      "uk-UA",
      {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2
      }
    );
}

function formatCrypto(number) {

  return Number(number)
    .toLocaleString(
      "uk-UA",
      {

        minimumFractionDigits: 2,

        maximumFractionDigits: 8
      }
    );
}

async function createBubbles() {

  const bg =
    document.getElementById("bubblesBg");

  bg.innerHTML = "";

  try {

    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr"
    );

    const data = await response.json();

    const bubbleCoins = data

      .filter(item =>
        item.symbol.endsWith("USDT")
      )

      .sort((a, b) =>

        Math.abs(
          Number(b.priceChangePercent)
        )

        -

        Math.abs(
          Number(a.priceChangePercent)
        )
      )

      .slice(0, 65);

    bubbleCoins.forEach(item => {

      const symbol =
        item.symbol.replace("USDT", "");

      const percent =
        Number(item.priceChangePercent);

      const bubble =
        document.createElement("div");

      const isGreen = percent >= 0;

      const size = Math.min(
        140,
        Math.max(
          28,
          Math.abs(percent) * 4
        )
      );

      const randomScale =
        Math.random() * 0.7 + 0.6;

      const finalSize =
        size * randomScale;

      bubble.className =
        `bubble ${isGreen ? "green" : "red"}`;

      bubble.style.width =
        finalSize + "px";

      bubble.style.height =
        finalSize + "px";

      bubble.style.left =
        Math.random() * 92 + "%";

      bubble.style.top =
        Math.random() * 92 + "%";

      bubble.style.animationDuration =
        (Math.random() * 8 + 6) + "s";

      bubble.style.zIndex =
        Math.floor(finalSize);

      bubble.style.opacity =
        (Math.random() * 0.5 + 0.5);

      bubble.innerHTML = `

        <img
          src="https://cryptoicons.org/api/icon/${symbol.toLowerCase()}/50"
          class="coin-icon"

          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        >

        <div class="coin-fallback">
          ${symbol.charAt(0)}
        </div>

        <span>${symbol}</span>

        <small>
          ${isGreen ? "+" : ""}
          ${percent.toFixed(1)}%
        </small>

      `;

      bg.appendChild(bubble);
    });

  } catch (error) {

    console.log(error);
  }
}

createBubbles();

setInterval(createBubbles, 20000);
