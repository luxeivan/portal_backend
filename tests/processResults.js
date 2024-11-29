const fs = require("fs");
const moment = require("moment-timezone");

moment.tz.setDefault("Europe/Moscow");

fs.readFile("summary.json", "utf8", (err, data) => {
  if (err) {
    console.error("Ошибка при чтении файла результатов:", err);
    return;
  }

  const results = JSON.parse(data);

  processResults(results);
});

function processResults(results) {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                  📊 Результаты тестирования                  ");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Получаем текущее время как время окончания теста
  const endTime = moment();

  // Получаем длительность теста из метрики iteration_duration.sum
  let testDuration = null;
  if (
    results.metrics.iteration_duration &&
    results.metrics.iteration_duration.sum
  ) {
    const totalDurationMs = results.metrics.iteration_duration.sum; // в миллисекундах
    testDuration = moment.duration(totalDurationMs, "milliseconds");
  }

  if (testDuration) {
    const startTime = moment(endTime).subtract(testDuration);
    console.log(
      `🕘 Время начала теста: ${startTime.format("YYYY-MM-DD HH:mm:ss")}`
    );
    console.log(
      `🕙 Время окончания теста: ${endTime.format("YYYY-MM-DD HH:mm:ss")}`
    );
    console.log(
      `⏱  Общая длительность теста: ${formatDuration(testDuration)}\n`
    );
  } else {
    console.log(`⏱  Длительность теста недоступна\n`);
  }

  const metrics = results.metrics;

  // Проверки (checks)
  const checks = metrics.checks;
  if (checks) {
    const passes = checks.passes || 0;
    const fails = checks.fails || 0;
    const totalChecks = passes + fails;
    const successRate = totalChecks > 0 ? (passes / totalChecks) * 100 : 0;

    console.log("✅ Проверки (checks):");
    console.log(`   • Всего проверок: ${totalChecks}`);
    console.log(`   • Успешных: ${passes}`);
    console.log(`   • Неудачных: ${fails}`);
    console.log(`   • Процент успешных: ${successRate.toFixed(2)}%\n`);
  }

  // HTTP-запросы (http_reqs)
  const httpReqs = metrics.http_reqs;
  if (httpReqs) {
    console.log("🌐 HTTP-запросы (http_reqs):");
    console.log(`   • Всего запросов: ${httpReqs.count}`);
    console.log(`   • Запросов в секунду: ${httpReqs.rate.toFixed(2)}\n`);
  }

  // Длительность HTTP-запросов (http_req_duration)
  const httpReqDuration = metrics.http_req_duration;
  if (httpReqDuration) {
    console.log("⏳ Длительность HTTP-запросов (http_req_duration):");
    console.log(`   • Среднее время: ${httpReqDuration.avg.toFixed(2)} мс`);
    console.log(`   • Минимальное время: ${httpReqDuration.min.toFixed(2)} мс`);
    console.log(
      `   • Максимальное время: ${httpReqDuration.max.toFixed(2)} мс`
    );
    console.log(`   • Медианное время: ${httpReqDuration.med.toFixed(2)} мс`);
    console.log(
      `   • 90% запросов выполнено быстрее чем ${httpReqDuration[
        "p(90)"
      ].toFixed(2)} мс`
    );
    console.log(
      `   • 95% запросов выполнено быстрее чем ${httpReqDuration[
        "p(95)"
      ].toFixed(2)} мс\n`
    );
  }

  // Неудачные HTTP-запросы (http_req_failed)
  const httpReqFailed = metrics.http_req_failed;
  if (httpReqFailed) {
    const failRate = httpReqFailed.rate ? httpReqFailed.rate * 100 : 0;
    const totalFailed = httpReqFailed.count || 0;
    console.log("❌ Неудачные HTTP-запросы (http_req_failed):");
    console.log(`   • Процент неудачных: ${failRate.toFixed(2)}%`);
    console.log(`   • Всего неудачных: ${totalFailed}\n`);
  }

  console.log("═══════════════════════════════════════════════════════════");
}

function formatDuration(duration) {
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let result = "";
  if (hours > 0) {
    result += `${hours} ч `;
  }
  if (minutes > 0) {
    result += `${minutes} мин `;
  }
  if (seconds > 0 || result === "") {
    result += `${seconds} сек`;
  }
  return result.trim();
}
