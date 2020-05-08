#include "./mtrandom.h"
#include <stdlib.h>
#include <stdio.h>
#include <vector>
#include <time.h>

std::vector<char> getSingle(mtrandom *rnd, int count)
{
	std::vector<char> sequence;
	for (int j = 0; j < count; ++j)
	{
		sequence.push_back(j);
	}
	for(size_t i = sequence.size() - 1; i > 0; --i) {
		int swap = rnd->real() * (i + 1);
		std::swap(sequence[i], sequence[swap]);
	}
	return sequence;
}

int main(int argc, char *argv[])
{
	mtrandom rnd;
	time_t seed = time(0);
	rnd.reset(seed % __UINT32_MAX__);
	for (int i = 1; i < argc; ++i)
	{
		const int count = atoi(argv[i]);
		std::vector<char> sequence = getSingle(&rnd, count);
		printf("%d", sequence[0]);
		for (int j = 1; j < count; ++j)
		{
			printf(" %d", sequence[j]);
		}
		printf("\n");
	}
	return 0;
}
