use clap::Parser;
use simulator::simulate;

mod generator;
mod simulator;

#[derive(Parser, Debug)]
struct Config {
    #[arg(short, long = "game")]
    game_sample_count: usize,

    #[arg(short, long = "prob", default_value_t = 10000)]
    prob_sample_count: usize,
}

fn main() {
    let config = Config::parse();
    const PROB_THRESHOLDS: [f64; 3] = [0.5, 0.9, 0.99];

    println!("[Configuration]");
    println!("game_sample_count: {}", config.game_sample_count);
    println!("prob_sample_count: {}", config.prob_sample_count);
    println!();

    let mut probs = vec![];

    println!("[Each consumption]");

    for board_type in 0..3 {
        let mut p = vec![];

        for target_item in 0..3 {
            let result = simulate(
                board_type,
                target_item,
                config.game_sample_count,
                config.prob_sample_count,
            );
            println!(
                "board {} / target {}: {:?}",
                board_type, target_item, result
            );

            // 累積和を取る
            let mut prefix_p = result.clone();

            for i in 0..prefix_p.len() - 1 {
                prefix_p[i + 1] += prefix_p[i];
            }

            for mul_prob in PROB_THRESHOLDS {
                for i in (0..prefix_p.len()).rev() {
                    if prefix_p[i] < mul_prob {
                        println!("{}%: {}", mul_prob * 100.0, i + 1);
                        break;
                    }
                }
            }

            println!();

            p.push(result);
        }

        probs.push(p);
    }

    println!();

    println!("[Total consumption]");

    for start in 0..6 {
        for target_item in 0..3 {
            let mut dp = vec![1.0];

            for stage in start..6 {
                let probs = &probs[stage % 3][target_item];
                let mut next_dp = vec![0.0; dp.len() + probs.len() - 1];

                // 畳み込み
                for i in 0..dp.len() {
                    for j in 0..probs.len() {
                        next_dp[i + j] += dp[i] * probs[j];
                    }
                }

                dp = next_dp;
            }

            // 累積和を取る
            for i in 0..dp.len() - 1 {
                dp[i + 1] += dp[i];
            }

            println!("start {} / target {}: {:?}", start, target_item, dp);

            for mul_prob in PROB_THRESHOLDS {
                for i in (0..dp.len()).rev() {
                    if dp[i] < mul_prob {
                        println!("{}%: {}", mul_prob * 100.0, i + 1);
                        break;
                    }
                }
            }

            println!();
        }
    }
}
